import log from '../../util/log';
/**
 * PicoSerialクラスは、シリアルポートの選択と接続を管理します。
 */

class SerialProcessor {
    /**
     * 
     * @param {*} _v_ デバイスから返却作成された値を格納するオブジェクト
     */
    constructor(_v_) {
        this.buffer = '';
        this._v_ = _v_; // デバイスから返却作成された値を格納するオブジェクトを保存
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
                if (typeof this._v_ === 'object' && this._v_ !== null) {
                    Object.assign(this._v_, jsonData);
                } else {
                    this._v_ = jsonData;
                }
                console.log('Parsed JSON this._v_:', this._v_);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
            }
        } else {
            console.log('Received line:', line);
        }
    }
}

export class PicoSerial {
    constructor(runtime) {

        // ランタイムを保存
        this._runtime = runtime;
        // 書き込み Stream
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
        console.log('Serial port connected!!:', event);
        // 必要な処理をここに追加
        this.status = 2;
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);

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
     * 
     * @returns {boolean} 接続中かどうか
     */
    isConnected() {
        return this.status === 2;
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
     * @param {string} _v_ - デバイスから返却された値を格納するオブジェクト
     */
    async openpicoport(_v_) {
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
        // 1行毎に解析して、this._v_ に受信した変数を格納する
        const serialProcessor = new SerialProcessor(_v_);
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
