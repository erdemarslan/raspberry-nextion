// SerialPort için gerekli dosyalar
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter')

var PORT = '/dev/ttyS0';
var BAUDRATE = 9600;

// Serial i açalım
const nextion = new SerialPort( PORT, { baudRate: BAUDRATE }, function(err) {
	if(err) {
		return console.log("Ekrana bağlanılamadı. Hata: ", err.message);
	} else {
		console.log('Nextion Ekran ', PORT, ' üzerinde ', BAUDRATE, ' bps ile açıldı.');
		command.setPage(0);
	}
});

const read = nextion.pipe(new Delimiter({ delimiter: hex('') }));
read.on('data', function(data) {
	//console.log(data);
	var returnCode = data[0];
	switch(returnCode) {
		// Sistem komutları
		case 0x00:
			if(typeof data[1] !== 'undefined' && data[1] == 0x00 && typeof data[2] !== 'undefined' && data[2] == 0x00) {
				console.log("Nextion Device is Start or Reset.");
			}
		break;

		case 0x88:
			console.log("Nextion Device is ready.");
		break;

		case 0x86:
			console.log("Nextion Device is entering sleep mode.");
		break;

		case 0x87:
			console.log("Nextion Device is leaving sleep mode.");
		break;

		// Gelen string ise....
		case 0x70:
			data = data.slice(1, data.length);
			console.log(data.toString());
		break;

		// Gelen int ise
		case 0x71:
			data = data.slice(1, data.length);
			var number = data[0] + data[1] * 256 + data[2] * 65536 + data[3] * 16777216;
			console.log(number);
		break;

		case 0x66:
			data = data.slice(1, data.length);
			console.log("Current Page is " + data);
		break;

		// touch event handled
		case 0x65:
			var pageNum = data[1];
			var componentId = data[2];
			var state = data[3] == 0 ? "Released" : "Pressed";
			console.log("Page " + pageNum + " Component " + componentId + " " + state);

			if(componentId == 3) {
				command.getValue("h0.val");
			}
		break;

		case 0x24:
			console.log("Şimdi sıçtık...");
		break;

		default:
			console.log(data);
		break;
	}	
});


var command = {
	setPage : function(num) {
		writeUart('page ' + num);
	},

	refreshCompanent : function(Id) {
		writeUart('ref ' + Id);
	},

	click : function(Id, event) {
		writeUart('click ' + Id + ',' + event);
	},

	getValue : function(what) {
		writeUart('get ' + what);
	},

	setText : function(component, value) {
		writeUart(component + '.txt="' + value + '"');
	},

	getPage : function() {
		writeUart('sendme');
	},

	uart : function(cmd) {
		writeUart(cmd);
	},

	setBackLight : function(num, save=false) {
		if(save) {
			writeUart("dims=" + num);
		} else {
			writeUart("dim=" + num);
		}
	},

	setSleepTime : function(num, autoWakeOnTouch=true) {
		if(num == 0) {
			console.log("Uyku kapatıldı...");
			writeUart("thsp=0");
		} else {
			if(num < 3) {
				num = 3;
			} else if(num > 65535) {
				num = 65535;
			}
			console.log("Uyku girildi. Süre: " + num);
			writeUart("thsp=" + num);
		}

		if(autoWakeOnTouch) {
			console.log("Dokununca uyanacak...");
			writeUart("thup=1");
		} else {
			console.log("Dokununca uyanmayacak...");
			writeUart("thup=0");
		}
	},

	setRTC : function(year, month, day, hour, minute, second) {
		writeUart("rtc0=" + year);
		writeUart("rtc1=" + month);
		writeUart("rtc2=" + day);
		writeUart("rtc3=" + hour);
		writeUart("rtc4=" + minute);
		writeUart("rtc5=" + second);
		console.log("RTC Set...");
	},

	setVisual : function(component, show=true) {
		var val = show ? "1" : "0";
		writeUart("vis " + component + "," + val);
	},

	reset : function() {
		writeUart("rest");
	},

	setItemTextColor : function(component, num) {
		writeUart(component + ".pco=" + num);
	},

	setItemBackgroundColor : function(component, num) {
		writeUart(component + ".bco=" + num);
	}
};

// Komutu ekrana yazar...
function writeUart(cmd){
	nextion.write(hex(cmd));
}

// ekrandan gelen verileri okur...
function readUart(data){
	console.log(data.join(" "));
}

// Ekrana veri yazılması için gerekli dönüştürmeyi yapar...
function hex(str) {
	var arr = [];
	for (var i = 0, l = str.length; i < l; i ++) {
		var ascii = str.charCodeAt(i);
		arr.push(ascii);
	}
	arr.push(255);
	arr.push(255);
	arr.push(255);
	return Buffer.from(arr);
}
//command.uart("recmod=0");
//command.getValue("sys0");
