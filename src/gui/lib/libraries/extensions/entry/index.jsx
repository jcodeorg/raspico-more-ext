/**
 * This is an extension for Xcratch.
 */

import iconURL from './entry-icon.png';
import insetIconURL from './inset-icon.svg';
import translations from './translations.json';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const version = 'v0.9.1';

const entry = {
    get name () {
        return `${formatMessage({
            id: 'pcratchPico.entry.name',
            defaultMessage: 'Pcratch Pico controll Micro-Python device',
            description: 'Pcratch Pico'
        })} (${version})`;
    },
    extensionId: 'pcratchPico',
    extensionURL: 'https://xcratch.github.io/xcx-example/dist/pcratchPico.mjs',
    collaborator: 'xcratch',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            defaultMessage: 'an extension for Xcratch',
            description: 'Description for this extension',
            id: 'pcratchPico.entry.description'
        });
    },
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    launchPeripheralConnectionFlow: true,
    useAutoScan: false,
    connectionIconURL: insetIconURL,
    connectionSmallIconURL: insetIconURL,
    get connectingMessage () {
        return formatMessage({
            defaultMessage: 'Connecting',
            description: 'Message to help people connect to their micro:bit.',
            id: 'gui.extension.microbit.connectingMessage'
        });
    },
    helpLink: 'https://xcratch.github.io/xcx-example/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

export {entry}; // loadable-extension needs this line.
export default entry;
