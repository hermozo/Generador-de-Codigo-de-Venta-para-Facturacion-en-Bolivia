export class Codigocontrol {
    protected d: any;

    protected p: any;
    protected inv: any;

    constructor() {
        this.d = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
            [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
            [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
            [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
            [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
            [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
            [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
            [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
            [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        ];
        this.p = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
            [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
            [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
            [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
            [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
            [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
            [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
        ];
        this.inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
    }

    public run(authorizationNumber: any, numerofactura: any, cinit: any, fechaTransaccion: any, cuentraTransaccion: any, docificacion: any) {
        let transactionAmount = this.roundUp(cuentraTransaccion);
        let invoiceNumber = this.addVerhoeffDigit(numerofactura, 2);
        let nitci = this.addVerhoeffDigit(cinit, 2);
        let dateOfTransaction = this.addVerhoeffDigit(fechaTransaccion, 2);
        transactionAmount = this.addVerhoeffDigit(transactionAmount, 2);
        let sumOfletiables = Number(invoiceNumber) + Number(nitci) + Number(dateOfTransaction) + Number(transactionAmount);
        let sumOfletiables5Verhoeff = this.addVerhoeffDigit(sumOfletiables, 5);
        let fiveDigitsVerhoeff = sumOfletiables5Verhoeff.substr(sumOfletiables5Verhoeff.length - 5, 5);
        let numbers = fiveDigitsVerhoeff.split("");
        for (let i = 0; i < 5; i++) {
            numbers[i] = parseInt(numbers[i]) + 1;
        }
        let string1 = docificacion.substr(0, numbers[0]);
        let string2 = docificacion.substr(numbers[0], numbers[1]);
        let string3 = docificacion.substr(numbers[0] + numbers[1], numbers[2]);
        let string4 = docificacion.substr(numbers[0] + numbers[1] + numbers[2], numbers[3]);
        let string5 = docificacion.substr(numbers[0] + numbers[1] + numbers[2] + numbers[3], numbers[4]);
        let authorizationNumberDKey = authorizationNumber + string1;
        let invoiceNumberdKey = invoiceNumber + string2;
        let NITCIDKey = nitci + string3;
        let dateOfTransactionDKey = dateOfTransaction + string4;
        let transactionAmountDKey = transactionAmount + string5;
        let stringDKey = authorizationNumberDKey.toString() + invoiceNumberdKey.toString() + NITCIDKey.toString() + dateOfTransactionDKey.toString() + transactionAmountDKey.toString();
        let keyForEncryption = docificacion.toString() + fiveDigitsVerhoeff.toString();
        let allegedRC4String = this.encryptMessageRC4(stringDKey, keyForEncryption, true);
        let chars = allegedRC4String.split("");
        let totalAmount = 0;
        let sp1 = 0;
        let sp2 = 0;
        let sp3 = 0;
        let sp4 = 0;
        let sp5 = 0;
        let tmp = 1;
        for (let i = 0; i < allegedRC4String.length; i++) {
            totalAmount += chars[i].charCodeAt(0);
            switch (tmp) {
                case 1:
                    sp1 += chars[i].charCodeAt(0);
                    break;
                case 2:
                    sp2 += chars[i].charCodeAt(0);
                    break;
                case 3:
                    sp3 += chars[i].charCodeAt(0);
                    break;
                case 4:
                    sp4 += chars[i].charCodeAt(0);
                    break;
                case 5:
                    sp5 += chars[i].charCodeAt(0);
                    break;
            }
            tmp = (tmp < 5) ? tmp + 1 : 1;
        }
        let tmp1 = Math.floor(totalAmount * sp1 / numbers[0]);
        let tmp2 = Math.floor(totalAmount * sp2 / numbers[1]);
        let tmp3 = Math.floor(totalAmount * sp3 / numbers[2]);
        let tmp4 = Math.floor(totalAmount * sp4 / numbers[3]);
        let tmp5 = Math.floor(totalAmount * sp5 / numbers[4]);
        let sumProduct = tmp1 + tmp2 + tmp3 + tmp4 + tmp5;
        let base64SIN = this.convertBase64(sumProduct);
        return this.encryptMessageRC4(base64SIN, docificacion + fiveDigitsVerhoeff, false);
    }

    private addVerhoeffDigit(value, max) {
        let val = 0;
        for (let i = 1; i <= max; i++) {
            val = this.generateVerhoeff(value);
            value += val.toString();
        }
        return value;
    }

    private roundUp(value) {
        let value2 = value.replace(',', '.');
        return Math.round(value2);
    }

    private inletray(array: any) {
        if (Object.prototype.toString.call(array) == "[object Number]") {
            array = String(array);
        }
        if (Object.prototype.toString.call(array) == "[object String]") {
            array = array.split("").map(Number);
        }
        return array.reverse();
    }

    private generateVerhoeff(array) {
        let c = 0;
        let invertedArray = this.inletray(array);
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[((i + 1) % 8)][invertedArray[i]]];
        }
        return this.inv[c];
    }

    private validate(array) {
        let c = 0;
        let invertedArray = this.inletray(array);
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[(i % 8)][invertedArray[i]]];
        }
        return (c === 0);
    }

    private convertBase64(value) {
        let dictionary = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
            "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
            "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d",
            "e", "f", "g", "h", "i", "j", "k", "l", "m", "n",
            "o", "p", "q", "r", "s", "t", "u", "v", "w", "x",
            "y", "z", "+", "/");
        let quotient = 1;
        let word = "";
        let remainder;
        while (quotient > 0) {
            quotient = Math.floor(value / 64);
            remainder = value % 64;
            word = dictionary[remainder] + word;
            value = quotient;
        }
        return word;
    }

    private encryptMessageRC4(message, key, unscripted) {
        let state = new Array(255);
        let x = 0;
        let y = 0;
        let index1 = 0;
        let index2 = 0;
        let nmen = "";
        let messageEncryption = "";
        for (let i = 0; i <= 255; i++) {
            state[i] = i;
        }
        for (let i = 0; i <= 255; i++) {
            index2 = ( (key.charAt(index1).charCodeAt() ) + state[i] + index2) % 256;
            let aux = state[i];
            state[i] = state[index2];
            state[index2] = aux;
            index1 = (index1 + 1 ) % key.length;
        }
        for (let i = 0; i < message.length; i++) {
            x = (x + 1) % 256;
            y = (state[x] + y) % 256;
            let aux = state[x];
            state[x] = state[y];
            state[y] = aux;
            let nmen = ( (message.charAt(i)).charCodeAt()) ^ state[(state[x] + state[y]) % 256];
            let nmenHex = nmen.toString(16).toUpperCase();
            messageEncryption = messageEncryption + ( (unscripted) ? "" : "-") + ((nmenHex.length === 1) ? ('0' + nmenHex) : nmenHex);
        }
        return ((unscripted) ? messageEncryption : messageEncryption.substring(1, messageEncryption.length));
    }
}

let codigoControl = new Codigocontrol();
let cod:string = codigoControl.run(authorizationNumber, numerofactura, cinit, fechaTransaccion, cuentraTransaccion, docificacion);