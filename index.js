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
    
    this.commandClass           = 0x71;
    this.manufacturerId         = 0x0109;
    this.manufacturerProductId  = [
       0x0101,
       0x0102,
       0x0104,
       0x0105
    ];
    
    this.bindings   = [];
    this.devices    = {};
}

inherits(VisionZD2102, AutomationModule);

_module = VisionZD2102;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

VisionZD2102.prototype.init = function(config) {
    VisionZD2102.super_.prototype.init.call(this, config);

    var self = this;

    
    this.zwayBind = function(dataBindings, zwayName, nodeId, instanceId, commandClassId, path, func, type) {
        console.log('[VisionZD2102] Bind' + zwayName);
    };
    this.zwayUnbind = function(dataBindings) {
        console.log('[VisionZD2102] Unbind');
    };
        
    this.zwayReg = function (zwayName) {
        var zway = global.ZWave && global.ZWave[zwayName].zway;
        if (!zway) {
            return;
        }
        
        console.log('[VisionZD2102] Registering '+zwayName);
        for(deviceIndex in zway.devices) {
            var device = zway.devices[deviceIndex];
            
            if (typeof(device) !== 'undefined'
                && device.data.manufacturerId.value == self.manufacturerId
                && _.indexOf(self.manufacturerProductId, device.data.manufacturerProductId.value) >= 0) {
                
                for(instanceIndex in device.instances) {
                    var instance = device.instances[instanceIndex];
                    if (typeof(instance.commandClasses[self.commandClass.toString()]) !== 'undefined') {
                        console.log('[VisionZD2102] Adding devices.'+deviceIndex+'.instances.'+instanceIndex);
                        self.handleDevice(zway,device,instance);
                    }
                }
            }
        }
        
        self.bindings[zwayName] = [];
    };
    
    this.zwayUnreg = function(zwayName) {
        // detach handlers
        if (self.bindings[zwayName]) {
            self.controller.emit("ZWave.dataUnbind", self.bindings[zwayName]);
        }
        self.bindings[zwayName] = null;
    };
    
    //this.controller.on("ZWave.register", this.zwayReg);
    //this.controller.on("ZWave.unregister", this.zwayUnreg);
    this.controller.on("ZWave.dataBind", this.zwayBind);
    this.controller.on("ZWave.dataUnbind", this.zwayUnbind);
    
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
    self.controller.off("ZWave.dataBind", self._dataBind);
    self.controller.off("ZWave.dataUnbind", self._dataUnbind);
    
    _.each(self.devices,function(deviceId,vDev) {
        self.controller.devices.remove(vDevId);
    });
    
    _.each(self.bindings,function(binding) {
        binding.data.unbind(binding.func);
    });
    
    self.bindings = [];
    self.devices = {};
    
    VisionZD2102.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

VisionZD2102.prototype.handleDevice = function(zway,device,instance) {
    var self = this;
    
    vDevId = 'VisionZD2102' + device.id +'_'+instance.id;
    
    if (! self.controller.devices.get(vDevId)) {
        var vDev = self.controller.devices.create({
            deviceId: vDevId,
            defaults: {
                probeTitle: 'General purpose',
                scaleTitle: '',
                icon: 'motion',
                level: '',
                title: 'Vision ZD2102 secondary input'
            },
            overlay: {
                deviceType: 'sensorBinary'
            },
            moduleId: self.id
        });
        
        if (vDev) {
            var dataHolder = instance.commandClasses[self.commandClass].data[7];
            self.devices[vDevId] = vDev;
            self.bindings.push({
                data:       dataHolder,
                func:       dataHolder.bind(function(type) {
                    console.log('[VisionZD2102] Change event');
                    console.logJS(this);
                })
            });
        }
    }
};

/*
[2015-11-07 12:38:41.612] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.V1event.alarmType = 7 (0x00000007)
[2015-11-07 12:38:41.612] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.V1event.level = 0 (0x00000000)
[2015-11-07 12:38:41.613] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.V1event = Empty
[2015-11-07 12:38:41.613] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.7.eventParameters = byte[0]
[2015-11-07 12:38:41.614] [D] [zway]   ( zero-length buffer )
[2015-11-07 12:38:41.614] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.7.event = 2 (0x00000002)
[2015-11-07 12:38:41.617] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.7.eventString = "Intrusion, location unknown"
[2015-11-07 12:38:41.617] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.7.status = 255 (0x000000ff)
[2015-11-07 12:38:41.618] [D] [zway] SETDATA devices.15.instances.0.commandClasses.113.data.7 = Empty
*/