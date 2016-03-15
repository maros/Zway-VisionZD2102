/*** VisionZD2102 Z-Way HA module *******************************************

Version: 1.01
(c) Maroš Kollár, 2015
-----------------------------------------------------------------------------
Author: Maroš Kollár <maros@k-1.com>
    based on the PhilioHW module from Poltorak Serguei <ps@z-wave.me>
Description:
    Full support for the VisionZD2102 door/window sensor
    
******************************************************************************/

// ----------------------------------------------------------------------------
// --- Class definition, inheritance and setup
// ----------------------------------------------------------------------------

function VisionZD2102 (id, controller) {
    // Call superconstructor first (AutomationModule)
    VisionZD2102.super_.call(this, id, controller);
    
    this.langFile               = undefined;
    this.commandClass           = 0x71;
    this.manufacturerId         = 0x0109;
    this.manufacturerProductId  = [
       0x0101,
       0x0102,
       0x0104,
       0x0105
    ];
    
    this.devicesSecondary       = {};
    this.devicesTamper          = {};
    this.bindings               = [];
}

inherits(VisionZD2102, AutomationModule);

_module = VisionZD2102;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

VisionZD2102.prototype.init = function(config) {
    VisionZD2102.super_.prototype.init.call(this, config);
    
    var self = this;
    
    self.langFile   = self.controller.loadModuleLang("VisionZD2102");
    self.zwayReg = function (zwayName) {
        var zway = global.ZWave && global.ZWave[zwayName].zway;
        if (!zway) {
            return;
        }
        
        // Loop all devices 
        for(var deviceIndex in zway.devices) {
            var device = zway.devices[deviceIndex];
            
            // Get manufacturer and product id
            if (typeof(device) !== 'undefined'
                && device.data.manufacturerId.value == self.manufacturerId
                && _.indexOf(self.manufacturerProductId, device.data.manufacturerProductId.value) >= 0) {
                
                if (typeof(device.instances[0].commandClasses[self.commandClass.toString()]) !== 'undefined') {
                    console.log('[VisionZD2102] Adding devices.'+deviceIndex+'.instances.0');
                    self.handleDevice(zway,device);
                }
            }
        }
    };
    
    self.zwayUnreg = function(zwayName) {
        // detach handlers
        if (self.bindings[zwayName]) {
            self.controller.emit("ZWave.dataUnbind", self.bindings[zwayName]);
        }
        self.bindings[zwayName] = null;
    };
    
    self.controller.on("ZWave.register", self.zwayReg);
    self.controller.on("ZWave.unregister", self.zwayUnreg);
    
    // walk through existing ZWave
    if (global.ZWave) {
        for (var name in global.ZWave) {
            this.zwayReg(name);
        }
    }
};

VisionZD2102.prototype.stop = function () {
    var self = this;
    
    // unsign event handlers
    this.controller.off("ZWave.register", this.zwayReg);
    this.controller.off("ZWave.unregister", this.zwayUnreg);
    
    _.each(self.devicesSecondary,function(deviceId,vDev) {
        self.controller.devices.remove(deviceId);
    });
    _.each(self.devicesTamper,function(deviceId,vDev) {
        self.controller.devices.remove(deviceId);
    });
    
    _.each(self.bindings,function(binding) {
        binding.data.unbind(binding.func);
    });
    
    this.zwayReg            = undefined;
    this.zwayUnreg          = undefined;
    this.bindings           = [];
    this.devicesTamper      = {};
    this.devicesSecondary   = {};
    
    VisionZD2102.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

VisionZD2102.prototype.checkDevice = function(device) {
    var self = this;
    
    var dataHolder  = device.instances[0].commandClasses[self.commandClass].data;
    var alarmType   = dataHolder.V1event.alarmType.value;
    var alarmSource = dataHolder[alarmType].event.value;
    var alarmLevel  = dataHolder.V1event.level.value  === 0 ? "off" : "on";
    if (alarmSource === 254) {
        console.log('[VisionZD2102] Change event matters');
        console.log('[VisionZD2102] Change event matters - external sensor');
        self.devicesSecondary[device.id].set("metrics:level", alarmLevel);
    } else if (alarmSource === 3 && self.devicesTamper[device.id]) {
        console.log('[VisionZD2102] Change event matters - tamper');
        self.devicesTamper[device.id].set("metrics:level", alarmLevel);
    }
};

VisionZD2102.prototype.handleDevice = function(zway,device) {
    var self = this;
    
    var title               = device.data.givenName.value;
    var vDevSecondaryId     = 'VisionZD2102_' + device.id;
    var vDevTamperId        = 'VisionZD2102_' + device.id+'_tamper';
    var deviceSecondaryObject;
    var deviceTamperObject;
    
    if (! self.controller.devices.get(vDevSecondaryId)) {
        console.log('[VisionZD2102] Add secondary device');
        
        deviceSecondaryObject = self.addDevice(vDevSecondaryId,{
            probeType: "general_purpose",
            metrics: {
                icon: 'door',
                title: self.langFile.device_secondary+' '+title
            }
        });
        if (deviceSecondaryObject) {
            self.devicesSecondary[device.id] = deviceSecondaryObject;
        }
    }
    
    if (self.config.tamper 
        && ! self.controller.devices.get(vDevTamperId)) {
        console.log('[VisionZD2102] Add tamper device');
        
        deviceTamperObject = self.addDevice(vDevTamperId,{
            probeType: "alarm_burglar",
            metrics: {
                icon: 'alarm',
                title: self.langFile.device_tamper+' '+title
            }
        });
        
        if (deviceTamperObject) {
            self.devicesTamper[device.id] = deviceTamperObject;
        }
    }
    
    if (deviceSecondaryObject || deviceTamperObject) {
        var dataHolder      = device.instances[0].commandClasses[self.commandClass].data;
        var dataHolderEvent = dataHolder.V1event;
        
        self.bindings.push({
            data:       dataHolderEvent,
            func:       dataHolderEvent.bind(function(type) {
                console.log('[VisionZD2102] Change event');
                self.checkDevice(device);
            })
        });
        self.checkDevice(device);
    }
};

VisionZD2102.prototype.addDevice = function(vDevId,defaults) {
    var self = this;
    
    defaults.metrics = _.extend(defaults.metrics,{
        probeTitle:"General purpose",
        scaleTitle: '',
        level: 'off'
    });
    
    return self.controller.devices.create({
        deviceId: vDevId,
        defaults: defaults,
        overlay: {
            visibility: (_.indexOf(self.config.banned,vDevId) === -1 ? true:false),
            deviceType: 'sensorBinary'
        },
        moduleId: self.id
    });
};
