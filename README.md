# Zway-VisionZD2102

The ZD2102 has two normally closed contact terminals. Only the state of the 
internal sensor is reflected in the UI. This module creates one additional 
binary sensor for each Vision ZD2102 device in your network that reflects the
state of the secondary external sensor input.

# Configuration

None

# Events

No events are emitted.

# Virtual Devices

This module creates one additional binary sensor for each Vision ZD2102
device in your network.

# Installation

```shell
cd /opt/z-way-server/automation/modules
git clone https://github.com/maros/Zway-VisionZD2102.git VisionZD2102 --branch latest
```

To update or install a specific version
```shell
cd /opt/z-way-server/automation/modules/VisionZD2102
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
