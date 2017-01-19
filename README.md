# Zway-VisionZD2102

The ZD2102 has two normally closed contact terminals. Due to a wrong device
implementation only the state of the internal sensor is correctly shown in
the UI. This module creates one additional binary sensor for each Vision
ZD2102 device in your network that reflects the state of the secondary
external sensor input.

# Configuration

## banned

A list of sensors that should not be created

## tamper

Also create a device that represents the state of the taper switch.

## tamperReset

Older batches of the VisionZD2102 sensor do not report the end of tampering
but keep on sending regular tampering alarms while active. If this option
is set the tamper switch will be reset after the given time if no new tamper
reports were received.

# Events

No events are emitted.

# Virtual Devices

This module creates one additional binary sensor for each Vision ZD2102
device in your network.

# Installation

The prefered way of installing this module is via the "Zwave.me App Store"
available in 2.2.0 and higher. For stable module releases no access token is
required. If you want to test the latest pre-releases use 'k1_beta' as
app store access token.

For developers and users of older Zway versions installation via git is
recommended.

```shell
cd /opt/z-way-server/automation/userModules
git clone https://github.com/maros/Zway-VisionZD2102.git VisionZD2102 --branch latest
```

To update or install a specific version
```shell
cd /opt/z-way-server/automation/userModules/VisionZD2102
git fetch --tags
# For latest released version
git checkout tags/latest
# For a specific version
git checkout tags/1.02
# For development version
git checkout -b master --track origin/master
```

# License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or any
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
