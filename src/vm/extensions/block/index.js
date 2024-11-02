import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';

/**
 * デバイスから返却された変数
 */

var _v_ = {"dummy": 123};

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'xcratchExample';


/**
 * PicoSerialクラスは、シリアルポートの選択と接続を管理します。
 */

class SerialProcessor {
  constructor(parentInstance) {
      this.buffer = '';
      this.parentInstance = parentInstance; // 元のインスタンスを保存
  }

  async processData(reader) {
      while (true) {
          const { value, done } = await reader.read();
          if (done) {
              console.log('Disconnected.');
              break;
          }
          if (value) {
              const textDecoder = new TextDecoder();
              const decodedValue = textDecoder.decode(value);
              this.buffer += decodedValue;

              let newlineIndex;
              while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
                  const line = this.buffer.substring(0, newlineIndex).trim();
                  this.buffer = this.buffer.substring(newlineIndex + 1);
                  this.processLine(line);
              }
          }
      }
  }

  processLine(line) {
      if (line.startsWith('_v_=')) {
          const jsonString = line.substring(4);
          try {
              const jsonData = JSON.parse(jsonString);
              if (typeof _v_ === 'object' && _v_ !== null) {
                  Object.assign(_v_, jsonData);
              } else {
                  _v_ = jsonData;
              }
              console.log('Parsed JSON:', _v_);
          } catch (e) {
              console.error('Failed to parse JSON:', e);
          }
      } else {
          console.log('Received line:', line);
      }
  }
}

class PicoSerial {
    constructor() {
        this.picowriter = null;
        // ポート選択ドロップダウン
        this.portSelector = undefined;
        // 接続ボタン
        this.connectButton = undefined;
        this.portCounter = 1; // addNewPort で名前の末尾に付ける番号
      
        // 現在使用しているポート
        this.picoport = undefined;
        // 現在使用しているリーダー
        this.picoreader = undefined;
        // 接続ステータス
        this.status = 0; // 0:未接続 1:接続中 2:接続済み

        /*
            <select id="ports">
            <option value="prompt">Click 'Connect' to add a port...</option>
            </select>
        */
        // 1. select要素を作成
        const selectElement = document.createElement('select');
        selectElement.id = 'ports';
        // 2. option要素を作成して追加
        const options = [
            { value: 'prompt', text: "Click 'Connect' to add a port..." }
        ];
        options.forEach(optionData => {
            const optionElement = document.createElement('option');
            optionElement.value = optionData.value;
            optionElement.text = optionData.text;
            selectElement.appendChild(optionElement);
        });
        // 3. select要素をDOMに追加
        document.body.appendChild(selectElement);
        this.portSelector = document.getElementById('ports');

      // シリアルポートの接続イベントを監視
      navigator.serial.addEventListener('connect', (event) => {
        console.log('Serial port connected:', event);
        // 必要な処理をここに追加
        this.status = 2;
      });

      // シリアルポートの切断イベントを監視
      navigator.serial.addEventListener('disconnect', (event) => {
        console.log('Serial port disconnected:', event);
        // 必要な処理をここに追加
        // 例えば、UIを更新したり、リソースを解放したりする
        this.status = 0;
      });

    }

    /**
     * 指定されたSerialPortを検索して返します。
     *
     * @param {SerialPort} port 検索するポート
     * @return {PortOption}
     */
    findPortOption(port) {
      if (!this.portSelector) return null;
      for (let i = 0; i < this.portSelector.options.length; ++i) {
        const option = this.portSelector.options[i];
        if (option.value === 'prompt') {
          continue;
        }
        const portOption = option;
        if (portOption.port === port) {
          return portOption;
        }
      }
      return null;
    }
  
    /**
    * 指定されたポートを選択ドロップダウンに追加します。
    *
    * @param {SerialPort} port 追加するポート
    * @return {PortOption}
    */
    addNewPort(port) {
      const portOption = document.createElement('option');
      portOption.textContent = `Port ${this.portCounter++}`;
      portOption.port = port;
      this.portSelector?.appendChild(portOption);
      return portOption;
    }
  
    /**
    * 指定されたポートを選択ドロップダウンに追加するか、既に存在する場合は既存のオプションを返します。
    *
    * @param {SerialPort} port 追加するポート
    * @return {PortOption}
    */
    maybeAddNewPort(port) {
      const portOption = this.findPortOption(port);
      if (portOption) {
        return portOption;
      }
      return this.addNewPort(port);
    }
  
    /**
    * 現在選択されているポートを |picoport| に設定します。
    * 選択されていない場合は、ユーザーにポートの選択を促します。
    */
    async getSelectedPort() {
      console.log('portSelector:', this.portSelector);
      if (this.portSelector?.value == 'prompt') {
        try {
          const serial = navigator.serial;
          this.picoport = await serial.requestPort({});
        } catch (e) {
          return;
        }
        const portOption = this.maybeAddNewPort(this.picoport);
        portOption.selected = true;
      } else {
        const selectedOption = this.portSelector?.selectedOptions[0];
        this.picoport = selectedOption?.port;
      }
    }
  
    /**
    * 接続をクローズします
    */
    async disconnectFromPort() {
      // Move |port| into a local variable so that connectToPort() doesn't try to
      // close it on exit.
      const localPort = this.picoport;
      this.picoport = undefined;
  
      if (this.picoreader) {
        await this.picoreader.cancel();
      }
  
      if (localPort) {
        try {
          await localPort.close();
        } catch (e) {
          console.error(e);
        }
      }
      //this.markDisconnected();
    }
  
    /**
     * ポートをオープンします
     */
    async openpicoport() {
      const ports = await navigator.serial.getPorts();
      ports.forEach((port) => this.addNewPort(port));

      await this.getSelectedPort();
      console.log('selectedPort:', this.picoport);
      if (!this.picoport) {
        return;
      }
      //this.markConnected();
      console.log('Connected!');
      try {
        await this.picoport.open({baudRate: 115200});
        const reader = this.picoport.readable.getReader();
        console.log('Connected!!');
        // 1行毎に解析して、_v_ に受信した変数を格納する
        const serialProcessor = new SerialProcessor(this);
        serialProcessor.processData(reader).catch(console.error);

        //term.writeln('<CONNECTED>');
      } catch (e) {
        console.error(e);
        //this.markDisconnected();
      }
    }
  
    /**
     * WritableStreamDefaultWriter を取得します。
     * @return {WritableStreamDefaultWriter | null}
     */
    async getWritablePort() {
      if (this.picoport && this.picoport.writable) {
        this.picowriter = this.picoport.writable.getWriter();
      } else {
        this.picowriter = null;
      }
      return this.picowriter;
    }
    /**
     * Releases the lock held by the `picowriter` if it exists.
     * This method checks if the `picowriter` is defined and, if so,
     * calls its `releaseLock` method to release any held resources.
     */
    releaseLock() {
      if (this.picowriter) {
        this.picowriter.releaseLock();
      }
    }
    /**
     * Writes the provided data to the Pico writer.
     *
     * @param {Uint8Array} data - The data to be written, represented as a Uint8Array.
     * @return A promise that resolves when the write operation is complete.
     */
    async picowrite(s) {
      this.getWritablePort();
      log.log(`picowrite: ${s} : ${this.picowriter}`);
      await this.picowriter?.write(new TextEncoder().encode(s));
      this.releaseLock();
    }
    async writeData(data) {
      this.getWritablePort();
      await this.picowriter?.write(data);
      this.releaseLock();
    }

}


/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://yokobond.github.io/xcx-xcratchExample/dist/xcratchExample.mjs';

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'xcratchExample.name',
            default: 'xcratchExample',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for xcratchExample.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }

        // シリアル接続
        try {
            this.picoserial = new PicoSerial();
        } catch (error) {
            console.log(error);
        }

    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: [
                {
                    // Picoに接続する
                    opcode: "connectPico",
                    text: formatMessage({
                        id: "websock.bind",
                        default: "MicroPythonデバイスと接続 [PORT]",
                        description: "MicroPythonデバイスとシリアル通信で接続します"
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            defaultValue: "0"
                        }
                    }
                },
                {
                  // コマンドを実行
                  opcode: "execCommand",
                  text: formatMessage({
                      id: "websock.send",
                      default: "[TEXT] を実行",
                  }),
                  blockType: BlockType.COMMAND,
                  arguments: {
                      TEXT: {
                          type: ArgumentType.STRING,
                          defaultValue: "help()"
                      }
                  }
                },
                {
                  // CTRL-x を送信する
                  opcode: "sendCtrlCode",
                  text: formatMessage({
                      id: "websock.close",
                      default: "CTRL- [TEXT] を送信",
                  }),
                  blockType: BlockType.COMMAND,
                  arguments: {
                    TEXT: {
                      type: ArgumentType.STRING,
                      defaultValue: "D"
                    }
                  }
                },
                {
                  opcode: 'dumpValue',
                  blockType: BlockType.REPORTER,
                  blockAllThreads: false,
                  text: formatMessage({
                      id: 'dumpValue',
                      default: 'デバイスの変数 [SCRIPT]',
                      description: 'デバイスの変数を表示する'
                  }),
                  arguments: {
                      SCRIPT: {
                          type: ArgumentType.STRING,
                          defaultValue: 'adc00'
                      }
                  }
              },
              {
                    opcode: 'do-it',
                    blockType: BlockType.REPORTER,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'xcratchExample.doIt',
                        default: 'do it [SCRIPT]',
                        description: 'execute javascript for example'
                    }),
                    func: 'doIt',
                    arguments: {
                        SCRIPT: {
                            type: ArgumentType.STRING,
                            defaultValue: '1 + 4'
                        }
                    }
                },
            ],
            menus: {
            }
        };
    }

    doIt (args) {
        const statement = Cast.toString(args.SCRIPT);
        const func = new Function(`return (${statement})`);
        log.log(`doIt: ${statement}`);
        return func.call(this);
    }

    /**
     * 
     * @param {*} args 
     * @returns 
     */
    dumpValue(args) {
      const statement = Cast.toString(args.SCRIPT);
      log.log(`dumpValue: ${statement}`);
      try {
        console.log('_v_:', _v_);
        const value = _v_[statement];
        return value;
      } catch (error) {
        console.log(error);
      }
      return undefined;
    }

    /**
     * Picoに接続する
     * connectPico
     */
    connectPico(args) {
        const port = Cast.toString(args.PORT);
        log.log(`connectPico: ${port}`);
        try {
            this.picoserial.openpicoport();
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * コマンド実行
     * Send Message.
     * @param {TEXT} args - the message to be sent.
     */
    execCommand(args) {
      try {
          const text = Cast.toString(args.TEXT);
          this.picoserial.picowrite(text + '\r\n');
      } catch (error) {
          console.log(error);
      }
    }
    /**
     * text の1文字目を大文字にして、A から Z なら、CTRL+A から CTRL+Z に変換して送信
     */
    sendCtrlCode (args) {
      const text = Cast.toString(args.TEXT);
      // text の1文字目を大文字にして、A から Z なら、CTRL+A から CTRL+Z に変換
      const textUpper = text.toUpperCase();
      const code = textUpper.charCodeAt(0);
      const ctrlCode = code - 64;
      log.log(`CTRL-: ${text} : ${code} : ${ctrlCode}`);
      this.picoserial.picowrite(String.fromCharCode(ctrlCode));
    }

}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
