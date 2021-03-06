Evented communication with RFXtrx433.
=====================================

How to Use
==========

rfxcom depends on the serialport module.

To install
----------

<pre>
  npm install rfxcom
</pre>

Depends on serialport 2.0.0+ and queue ^4.0.0

To Use
------

<pre>
var rfxcom = require('rfxcom'),
    pg = require('pg').native,
    conString = "pg://user:password@localhost/user",
    client = new pg.Client(conString);

var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: true});

/*
 * This reports security updates from X10 security devices.
 */
rfxtrx.on("security1", function (evt) {
  if (evt.deviceStatus === rfxcom.security.MOTION) {
    console.log("Device %s %s detected motion.", evt.subtype, evt.id);
  } else if (evt.deviceStatus === rfxcom.security.NOMOTION) {
    console.log("Device %s %s reported motion stopped.", evt.subtype, evt.id);
  }
});

rfxtrx.on("elec2", function (evt) {
  // Requires a PostgreSQL table
  // CREATE TABLE energy (recorded_time timestamp DEFAULT NOW(),
  //                      device_id VARCHAR, current_watts FLOAT)
  client.query("INSERT INTO energy(device_id, current_watts) values($1, $2)",
                [evt.id, evt.currentWatts]);
});

rfxtrx.initialise(function () {
    console.log("Device initialised");
});
</pre>

Sending Commands
===
Prototype objects are provided for some of the most useful protocols (see the RFXCOM manual for details):

* Lighting1
* Lighting2
* Lighting3
* Lighting4
* Lighting5
* Lighting6
* Chime1
* Curtain1

Each prototype has a constructor, most of which must be called with the required subtype as a second parameter.
The subtypes are exported from `index.js` and can be accessed as shown in the examples below. Each prototype has
functions to send the appropriate commands. File `DeviceCommands.md` contains a quick reference to all these transmitter
prototype objects.

Commands can only be sent when the RFXtrx433 is connected (see below). Commands are held in a queue, and will be sent as
soon as the RFXtrx433 can accept them. No commands are sent (and no messages received) until the initial handshake
with the RFXtrx433 is complete. If the RFXtrx433 is disconnected the queue is cleared, losing any cammand messages it
may contain.

LightwaveRf
-----------
LightwaveRf devices use the specialised Lighting5 prototype, which itself uses an RfxCom object.

<pre>
var rfxcom = require('rfxcom');

var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: true}),
    lightwaverf = new rfxcom.Lighting5(rfxtrx, rfxcom.lighting5.LIGHTWAVERF);

rfxtrx.initialise(function () {
  console.log("Device initialised");
  lightwaverf.switchOn("0xF09AC8/1", {mood: 0x03});
  lightwaverf.switchOn("0xF09AC8/2", {level: 0x10});
});
</pre>

I've tested it with both LightwaveRf lights, and the relay switch.

LightwaveRf lights get their identity from the remote used to pair, if you don't
have a remote, or if you want to specify the address manually, you can pair the
device by putting the device into pairing mode and turning on a chosen device id, for example lightwaverf.switchOn("0xFFFFFF/1").

The device ids don't have to be unique, but it's advisable.

HomeEasy (EU)
-------------
HomeEasy devices use the specialised Lighting2 prototype, which itself uses an RfxCom object. There are two types of
HomeEasy: the ones marketed in UK are of type 'AC', while those in the Netherlands and elsewhere are of type 'HOMEEASY_EU'.

<pre>
    var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: true}),
        lighting2 = new rfxcom.Lighting2(rfxtrx, rfxcom.lighting2.HOMEEASY_EU);

    lighting2.switchOn("0xF09AC8AA/1");
    lighting2.switchOff("0xF09AC8AA/1");
</pre>

RfxCom system events
====================

System events are used to track conection and disconnection of the RFXtrx433, and to provide
low-level access to received data.

"connecting"
------------
Emitted when the RFXcom has successfully opened the serial port.

"connectfailed"
------------
Emitted if the RFXcom was unable to open the serial port.

"ready"
-------
Emitted when the RFXtrx433 is ready to accept data (after a delay to prevent it from entering the bootloader).

"disconnect"
------------
Emitted if the RFXtrx433 has been disconnected from the USB port

"response"
----------
Emitted when a response message is received from the RFXtrx 433, sends the
status (from the RFXtrx433) and the sequence number of the message the response
is for.

"status"
--------
Emitted when a "status" message is received from the RFXtrx 433.

"end"
--------
Emitted when the serial port "ends".

"drain"
--------
Emitted when the serial port emits a "drain" event.

"receive"
---------
Emitted when any packet message is received from the RFXtrx 433, and contains the raw bytes that were received.
This event is emitted before the received data event for the packet type (if one is defined). 

RfxCom received data events - sensors
=====================================

The events are mostly named from the message identifiers used in the RFXtrx documentation. A protocol must
be enabled to be received. This can be done using RFXmngr.exe, or the `enable()` function of the rfxcom object.
Each event has an 'evt' property whose members contain the received sensor data, along with signal strength and
battery level (if available).

"security1"
-----------
Emitted when an X10 or similar security device reports a status change.

"temprain1"
-----------
Emitted when a message is received from an Allecto temperature/rainfall weather sensor.

"temp1" - "temp11"
-----------------
Emitted when a message is received from a temperature sensor (inside/outside air temperature; pool water temperature).

"humidity1"
-----------
Emitted when data arrives from humidity sensing devices

"th1" - "th14"
-------------
Emitted when a message is received from Oregon Scientific and other
temperature/humidity sensors.

"thb1" - "thb2"
---------------
Emitted when a message is received from an Oregon Scientific
temperature/humidity/barometric pressure sensor.

"rain1" - "rain7"
-----------------
Emitted when data arrives from rainfall sensing devices

"wind1" - "wind7"
-----------------
Emitted when data arrives from wind speed/direction sensors

"uv1" - "uv3"
-------------
Emiied when data arrives from ultraviolet radiation sensors

"weight1" - "weight2"
---------------------
Emitted when a message is received from a weighing scale device.

"elec1" - "elec5"
-----------------
Emitted when data is received from OWL or REVOLT electricity monitoring devices.

"rfxmeter"
----------
Emitted whan a message is received from an RFXCOM rfxmeter device.

"rfxsensor"
-----------
Emitted when a message is received from an RFXCOM rfxsensor device.

RfxCom received data events - remote controls
=============================================

These events are emitted when data arrives from a 'remote control' device, which may be a pushbutton
unit or a dedicated remote control device such as a PIR light switch. The events are named from the
message identifiers used in the RFXtrx documentation. A protocol must be enabled to be received. however not
every protocols that can be transmitted can be received. Each event has an 'evt' property whose members contain
the transmitted command, along with signal strength and battery level (if available).

"lighting1"
-----------
Emitted when a message is received from X10, ARC, Energenie or similar lighting remote control devices.

"lighting2"
-----------
Emitted when a message is received from AC/HomeEasy type remote control devices.

"lighting4"
-----------
Emitted when a message is received from devices using the PT2262 family chipset.

"lighting5"
-----------
Emitted when a message is received from LightwaveRF/Siemens type remote control devices.

"lighting6"
-----------
Emitted when a message is received from Blyss lighting remote control devices.

"chime1"
--------
Emitted when data arrives from Byron or similar doorbell pushbutton

"list"
------
Emitted when a response to the RFY command 'listremotes' is received.
(Some bytes of the response packet have unknown meaning.)

Connecting and disconnecting
============================
The function `rfxtrx.initialise()` will attempt to connect to the RFXtrx433 hardware. If this succeeds, a 'connecting' event
is emitted, followed about 5.5 seconds later by a 'ready' event. If the device is not present (wrong device path, or device
not plugged in) a 'connectfailed' event is emitted. If the the hardware is subsequently unplugged, a 'disconnect' event
is emitted (this can happen before either the 'connecting' or 'ready' events are emitted).

If either the connection fails or the RFXtrx433 is unplugged, a subsequent call to `initialise()` will attempt to reconnect.
The 'disconnect'/'connectfailed' handler may make repeated attempts to reconnect,
but <em>must</em> allow an interval of at least `rfxcom.initialiseWaitTime` milliseconds between each attempt. While
disconnected, any data sent by a call to a command object is silently discarded, however the various received data event
handlers are preserved.

<em>Note:</em>

Some variants of Linux will create a differently-named device file if the RFtxr433 is disconnected and then reconnected,
even if it is reconnected to the same USB port. For example, `/dev/ttyUSB0` may become `/dev/ttyUSB1`. To avoid any
problems this may cause, use the equivalent alias device file in `/dev/serial/by-id/` when creating the RfxCom object.
This should look something like `/dev/serial/by-id/usb_RFXCOM_RFXtrx433_12345678-if00-port0`.

Rfy (Somfy)
-----------
There's a specialised Rfy prototype, which uses an RfxCom object.

<pre>
    var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: true}),
        rfy = new rfxcom.Rfy(rfxtrx, rfxcom.rfy.RFY);

    rfy.up("01010101");
    rfy.down("01010101");
    rfy.do("01010101", 'down', function(err, res, sequenceNum) {
        if (!err) console.log('complete');
    });    
</pre>

The rfy message controls one of two subtypes, you need to specify the
subtype to the constructor, the options are rfxcom.rfy.RFY or 
rfxcom.rfy.RFYEXT.

Predefined commands include up(), down(), stop(), list() and program().
All other commands can be accessed via do() option, see defines.js 
RfyCommands for complete list of available commands.
