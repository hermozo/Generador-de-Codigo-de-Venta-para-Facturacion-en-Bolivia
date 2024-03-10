class CodigoControl {
    private d: number[][];
    private p: number[][];
    private inv: number[];

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

    public run(authorizationNumber: string, numerofactura: string, cinit: string, fechaTransaccion: string, cuentraTransaccion: string, docificacion: string): string {
        let transactionAmount = this.roundUp(cuentraTransaccion);
        let invoiceNumber = this.addVerhoeffDigit(numerofactura, 2);
        let nitci = this.addVerhoeffDigit(cinit, 2);
        let dateOfTransaction = this.addVerhoeffDigit(fechaTransaccion, 2);
        transactionAmount = this.addVerhoeffDigit(transactionAmount, 2);
        let sumOfVariables = Number(invoiceNumber) + Number(nitci) + Number(dateOfTransaction) + Number(transactionAmount);
        let sumOfVariables5Verhoeff = this.addVerhoeffDigit(sumOfVariables.toString(), 5);
        let fiveDigitsVerhoeff = sumOfVariables5Verhoeff.substr(sumOfVariables5Verhoeff.length - 5, 5);
        let numbers = fiveDigitsVerhoeff.split("").map(char => parseInt(char) + 1);
        let parts = this.splitDocificacion(docificacion, numbers);
        let concatenatedParts = parts.map((part, index) => part + docificacion.substr(parts.slice(0, index).reduce((acc, curr) => acc + curr.length, 0), numbers[index])).join("");
        let allegedRC4String = this.encryptMessageRC4(concatenatedParts, docificacion + fiveDigitsVerhoeff, true);
        let chars = allegedRC4String.split("");
        let totalAmount = chars.reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let sp = parts.map((part, index) => Math.floor(totalAmount * chars.slice(0, index).reduce((acc, char) => acc + char.charCodeAt(0), 0) / numbers[index]));
        let sumProduct = sp.reduce((acc, val, index) => acc + val * parts[index].length, 0);
        let base64SIN = this.convertBase64(sumProduct);
        return this.encryptMessageRC4(base64SIN, docificacion + fiveDigitsVerhoeff, false);
    }

    private addVerhoeffDigit(value: string, max: number): string {
        for (let i = 0; i < max; i++) {
            let val = this.generateVerhoeff(value);
            value += val.toString();
        }
        return value;
    }

    private roundUp(value: string): number {
        let value2 = value.replace(',', '.');
        return Math.round(parseFloat(value2));
    }

    private generateVerhoeff(array: string): number {
        let c = 0;
        let invertedArray = this.inletray(array);
        for (let i = 0; i < invertedArray.length; i++) {
            c = this.d[c][this.p[(i + 1) % 8][invertedArray[i]]];
        }
        return this.inv[c];
    }

    private inletray(array: string): number[] {
        if (Object.prototype.toString.call(array) === "[object Number]") {
            array = array.toString();
        }
        if (Object.prototype.toString.call(array) === "[object String]") {
            return array.split("").map(char => parseInt(char)).reverse();
        }
        return [];
    }

    private splitDocificacion(docificacion: string, numbers: number[]): string[] {
        let start = 0;
        return numbers.map(num => {
            let part = docificacion.substr(start, num);
            start += num;
            return part;
        });
    }

    private convertBase64(value: number): string {
        let dictionary = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";
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

    private encryptMessageRC4(message: string, key: string, unscripted: boolean): string {
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
            index2 = ((key.charCodeAt(index1)) + state[i] + index2) % 256;
            let aux = state[i];
            state[i] = state[index2];
            state[index2] = aux;
            index1 = (index1 + 1) % key.length;
        }
        for (let i = 0; i < message.length; i++) {
            x = (x + 1) % 256;
            y = (state[x] + y) % 256;
            let aux = state[x];
            state[x] = state[y];
            state[y] = aux;
            let nmen = ((message.charCodeAt(i)) ^ state[(state[x] + state[y]) % 256]).toString(16).toUpperCase();
            messageEncryption = messageEncryption + ((unscripted) ? "" : "-") + ((nmen.length === 1) ? ('0' + nmen) : nmen);
        }
        return ((unscripted) ? messageEncryption : messageEncryption.substring(1, messageEncryption.length));
    }
}

let codigoControl = new CodigoControl();
let cod: string = codigoControl.run(authorizationNumber, numerofactura, cinit, fechaTransaccion, cuentraTransaccion, docificacion);
