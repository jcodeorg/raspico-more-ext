import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';
import {Machine} from './machine';
import {PicoSerial} from './webserial.js';

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

const EXTENSION_ID = 'pcratchPico';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://yokobond.github.io/xcx-xcratchExample/dist/pcratchPico.mjs';

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
            id: 'pcratchPico.name',
            default: 'pcratchPico',
            description: 'pcratch Micro-Python Extension'
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
     * Construct a set of blocks for pcratchPico.
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

        // Create a new MicroBit peripheral instance
        // machine.picowrite(string)
        // machine.openpicoport(_v_)
        this.machine = new Machine(this.runtime, ExtensionBlocks.EXTENSION_ID);

        // シリアル接続
        //try {
        //    this.picoserial = new PicoSerial();
        //} catch (error) {
        //    console.log(error);
        //}

        //this.connectPeripheral(); // ペリフェラルに接続

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
                        id: "pcratchPico.connectPico",
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
                      id: "pcratchPico.execCommand",
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
                      id: "pcratchPico.sendCtrlCode",
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
                        id: 'pcratchPico.dumpValue',
                        default: 'デバイスの返却値! [SCRIPT]',
                        description: 'デバイスの変数を表示する!'
                    }),
                    arguments: {
                        SCRIPT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'adc00'
                        }
                    }
                },
                {
                    opcode: 'getAdc00',
                    text: formatMessage({
                        id: 'pcratchPico.getAdc00',
                        default: 'ADC0',
                        description: 'ADC0の値'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getAdc01',
                    text: formatMessage({
                        id: 'pcratchPico.getAdc01',
                        default: 'ADC1',
                        description: 'ADC1の値'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getAdc02',
                    text: formatMessage({
                        id: 'pcratchPico.getAdc02',
                        default: 'ADC2',
                        description: 'ADC2の値'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getAdc03',
                    text: formatMessage({
                        id: 'pcratchPico.getAdc03',
                        default: 'ADC3',
                        description: 'ADC3の値'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getAdc04',
                    text: formatMessage({
                        id: 'pcratchPico.getAdc04',
                        default: 'ADC4',
                        description: 'ADC4の値'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getLightLevel',
                    text: formatMessage({
                        id: 'pcratchPico.lightLevel',
                        default: 'light intensity',
                        description: 'how much the amount of light falling on the LEDs on micro:bit'
                    }),
                    blockType: BlockType.REPORTER
                },
            ],
            menus: {
            }
        };
    }
    /**
     * Get amount of light (0 - 255) on the LEDs.
     * @param {object} args - the block's arguments.
     * @return {number} - light level.
     */
    getLightLevel () {
      // const level = this.microbit.readLightLevel();
      // return Math.round(level * 1000 / 255) / 10;
      return 21;
    }
    /**
     * ADC 0-4 の値を取得する
     * @param {object} args - the block's arguments.
     * @return {number} 0 - 65535
     */
    getAdc00 () {
        return this.machine._v_ && this.machine._v_["adc00"] !== undefined ? this.machine._v_["adc00"] : 0;
    }
    getAdc01 () {
        return this.machine._v_ && this.machine._v_["adc01"] !== undefined ? this.machine._v_["adc01"] : 0;
    }
    getAdc02 () {
        return this.machine._v_ && this.machine._v_["adc02"] !== undefined ? this.machine._v_["adc02"] : 0;
    }
    getAdc03 () {
        return this.machine._v_ && this.machine._v_["adc03"] !== undefined ? this.machine._v_["adc03"] : 0;
    }
    getAdc04 () {
        return this.machine._v_ && this.machine._v_["adc04"] !== undefined ? this.machine._v_["adc04"] : 0;
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
        console.log('this.machine._v_:', this.machine._v_);
        const value = this.machine._v_[statement];
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
            this.machine.openpicoport();
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
          this.machine.picowrite(text + '\r\n');
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
      this.machine.picowrite(String.fromCharCode(ctrlCode));
    }

}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
