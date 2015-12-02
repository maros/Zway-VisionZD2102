/*** VisionZD2102 Z-Way HA module *******************************************

Version: 1.00
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
    
    this.devices    = {};
    this.bindings   = [];
    this.banned     = [];
    
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
    self.banned     = config.banned || [];
    
    self.zwayReg = function (zwayName) {
        var zway = global.ZWave && global.ZWave[zwayName].zway;
        if (!zway) {
            return;
        }
        
        for(var deviceIndex in zway.devices) {
            var device = zway.devices[deviceIndex];
            
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
    
    this.controller.on("ZWave.register", this.zwayReg);
    this.controller.on("ZWave.unregister", this.zwayUnreg);
    
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
    
    _.each(self.devices,function(deviceId,vDev) {
        self.controller.devices.remove(vDevId);
    });
    
    _.each(self.bindings,function(binding) {
        binding.data.unbind(binding.func);
    });
    
    this.zwayReg    = undefined;
    this.zwayUnreg  = undefined;
    this.bindings   = [];
    this.devices    = {};
    
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
    var alarmLevel  = dataHolder.V1event.level.value;
    if (alarmSource === 254) {
        console.log('[VisionZD2102] Change event matters');
        self.devices[device.id].set("metrics:level", alarmLevel === 0 ? "off" : "on");
    }
};

VisionZD2102.prototype.handleDevice = function(zway,device) {
    var self = this;
    
    vDevId = 'VisionZD2102_' + device.id;
    
    if (! self.controller.devices.get(vDevId)
        && _.indexOf(self.banned,vDevId) === -1) {
        console.log('[VisionZD2102] Add device');
        var deviceObject = self.controller.devices.create({
            deviceId: vDevId,
            defaults: {
                metrics: {
                    probeTitle: 'General purpose',
                    scaleTitle: '',
                    icon: 'motion',
                    level: 'off',
                    title: self.langFile.device_secondary
                }
            },
            overlay: {
                deviceType: 'sensorBinary'
            },
            moduleId: self.id
        });
        
        if (deviceObject) {
            self.devices[device.id] = deviceObject;
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
            /*
            var dataHolder = instance.commandClasses[self.commandClass].data; // Does not fire. Why?
            self.bindings.push({
                data:       dataHolder,
                func:       dataHolder.bind(function(type) {
                    console.log('[VisionZD2102] Change event top');
                    var alarmType   = this.V1event.alarmType.value;
                    var alarmSource = this[alarmType].event.value;
                    var alarmLevel  = this.V1event.level.value;
                    if (alarmSource === 254) {
                        vDev.set("metrics:level", alarmLevel === 0 ? "off" : "on");
                    }
                    console.logJS(this);
                })
            });
            */
        }
    }
};

