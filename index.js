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
}

inherits(VisionZD2102, AutomationModule);

_module = VisionZD2102;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

VisionZD2102.prototype.init = function(config) {
    VisionZD2102.super_.prototype.init.call(this, config);

    var self = this;

    this.ZWAY_DATA_CHANGE_TYPE = {   
        "Updated": 0x01,       // Value updated or child created
        "Invalidated": 0x02,   // Value invalidated             
        "Deleted": 0x03,       // Data holder deleted - callback is called last time before being deleted
        "ChildCreated": 0x04,  // New direct child node created                                          
                                                                                                         
        // ORed flags                                                                                    
        "PhantomUpdate": 0x40, // Data holder updated with same value (only updateTime changed)          
        "ChildEvent": 0x80     // Event from child node                                                  
    };
    
    this.CC = {
        "Alarm": 0x71
    };
    
    this.zwayRegister = function(zwayName) {
        var zway = global.ZWave && global.ZWave[zwayName].zway;
        
        if (!zway) {
            return;
        }
       
        if (!zway.ZMELEDBTN) {
            return;
        }
        // TODO
    };
    
    this.zwayUnregister = function(zwayName) {
        // detach handlers
        if (self.bindings[zwayName]) {
            self.controller.emit("ZWave.dataUnbind", self.bindings[zwayName]);
        }
        self.bindings[zwayName] = null;
    };
    
    this.controller.on("ZWave.register", this.zwayRegister);
    this.controller.on("ZWave.unregister", this.zwayUnregister);

    // walk through existing ZWave
    if (global.ZWave) {
        for (var name in global.ZWave) {
            this.zwayRegister(name);
        }
    }
}

VisionZD2102.prototype.stop = function () {
    // unsign event handlers
    this.controller.off("ZWave.register", this.zwayReg);
    this.controller.off("ZWave.unregister", this.zwayUnreg);

    // detach handlers
    for (var name in this.bindings) {
        this.controller.emit("ZWave.dataUnbind", this.bindings[name]);
    }
    
    this.bindings = [];

    VisionZD2102.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

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