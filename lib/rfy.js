module.exports = Rfy;
/*jshint -W104 */
const defines = require('./defines');

/*
 * This is a class for controlling Somfy RTS blind motors (RFY protocol)
 */
function Rfy(rfxcom, subtype) {
    var self = this;

    self.rfxcom = rfxcom;
    self.subtype = subtype;

    if (typeof self.subtype === "undefined") {
        self.subtype = 0x0;
    }
}

/*
 * Splits the device id into three id parts and unit code
 */
Rfy.prototype._splitDeviceId = function(deviceId) {
  // convert hex string into integer array
  var self = this;
  var parts = self.rfxcom.stringToBytes(deviceId);
  return {
      id1: parts.bytes[0] || 0,
      id2: parts.bytes[1] || 0,
      id3: parts.bytes[2] || 0,
      unitcode: parts.bytes[3] || 0
  };
};

Rfy.prototype._sendCommand = function(deviceId, command, callback) {
    var self = this,
        device = self._splitDeviceId(deviceId),
        seqnbr = self.rfxcom.getSequenceNumber(),
        buffer = [0x0c, defines.RFY, self.subtype, seqnbr,
                  device.id1, device.id2, device.id3, device.unitcode,
                  command, 0, 0, 0, 0]

    self.rfxcom.queueMessage(buffer, seqnbr, callback);
    return seqnbr;
};

Rfy.prototype.do = function(deviceId, command, callback) {
    if (typeof(command) === 'number') {
        return this._sendCommand(deviceId, defines.RfyCommands.up, callback);
    }
    else if (typeof(command) === 'string') {
        if (typeof(defines.RfyCommands[command]) !== 'undefined') {
            return this._sendCommand(deviceId, defines.RfyCommands[command], callback);
        }
    }
}

Rfy.prototype.up = function(deviceId, callback) {
    return this._sendCommand(deviceId, defines.RfyCommands.up, callback);
}

Rfy.prototype.down = function(deviceId, callback) {
    return this._sendCommand(deviceId, defines.RfyCommands.down, callback);
}

Rfy.prototype.stop = function(deviceId, callback) {
    return this._sendCommand(deviceId, defines.RfyCommands.stop, callback);
}

Rfy.prototype.list = function(callback) {
    return this._sendCommand("00000000", defines.RfyCommands.listremotes, callback);
}

Rfy.prototype.program = function(deviceId, callback) {
    return this._sendCommand(deviceId, defines.RfyCommands.program, callback);
}
