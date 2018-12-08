#include "Particle.h"

/*******************************************************************************
Declare this variable to use an NCD board
https://store.ncd.io/product/4-channel-general-purpose-spdt-relay-shield-4-gpio-with-iot-interface/
*******************************************************************************/
#define USE_NCD_BOARD

/*******************************************************************************
Declare this variable to use a Particle Relay Shield
https://store.particle.io/products/relay-shield

If you have the square, white RelayShield (from the Core) you will need
to make adjustements in the setup() function!
*******************************************************************************/
// #define USE_PARTICLE_RELAY_SHIELD

/*******************************************************************************
Declare this variable to use your own board
TODO: add link to wemos relay
*******************************************************************************/
// #define USE_SINGLE_RELAY
#define MY_RELAY D0

/*******************************************************************************
set this variable to the length of the pulse on the relay you want
300 msec is default
units are MILLISECONDS
*******************************************************************************/
#define MOMENTARY_TIMER 300

/*******************************************************************************
You need to define as well the number of relays on your board. 
MAX: 24 relays hard limit on the code - change it if you want
This software was tested with a 4 relays board.
*******************************************************************************/
#define NUMBER_OF_RELAYS 4

#ifdef USE_NCD_BOARD
#include "NCD4Relay.h"
#endif

#ifdef USE_PARTICLE_RELAY_SHIELD
#include "RelayShield.h"
#endif

#include "elapsedMillis.h"

#define APP_NAME "myRelays"
#define VERSION "Version 0.01"

/*******************************************************************************
 * changes in version 0.01:
       * Particle build link: https://go.particle.io/shared_apps/5c0bd73743c1fdc9fc0010fe
       * Initial version
       * changed the return standards of the original example on NCD relays:
          * if function succeeds, it returns 0
          * if function fails, it returns -1
       * Relay states are stored in EEPROM (non-volatile memory) to survive restarts/power losses
       * added Particle.variable("relaysState", relaysState); to propagate 
         relay status to the Ionic Framework app
       * This version is tested with the following boards:
         * one relay on an Argon device
         * 4 relays NCD board with Photon and Argon
*******************************************************************************/

#ifdef USE_NCD_BOARD
NCD4Relay relayController;
#endif

#ifdef USE_PARTICLE_RELAY_SHIELD
RelayShield myRelays;
#endif

//enable the user code (our program below) to run in parallel with cloud connectivity code
// source: https://docs.particle.io/reference/firmware/photon/#system-thread
SYSTEM_THREAD(ENABLED);
SYSTEM_MODE(AUTOMATIC);

// each digit represents a relay status
// so that 1000 means relay1 is on and the rest off
String relaysState = "";
#define RELAYS_STATE_SAMPLE_INTERVAL 500
elapsedMillis relaysStateSampleInterval;

// forward declaration of functions
void readFromEeprom();
void saveSettingsInEeprom();
void refreshRelaysState();
void initRelaysState();
int controlRelay(String command);
void turnOnRelay(int relay);
void turnOffRelay(int relay);
int readRelayStatus(int relay);
void turnOnAllRelays();
void turnOffAllRelays();

/*******************************************************************************
 structure for writing thresholds in eeprom
 https://docs.particle.io/reference/firmware/photon/#eeprom
*******************************************************************************/
// randomly chosen value here. The only thing that matters is that it's not 255
// since 255 is the default value for uninitialized eeprom
// value 124 will be used in version 0.1
#define EEPROM_VERSION 124
#define EEPROM_ADDRESS 0

struct EepromMemoryStructure
{
    uint8_t version = EEPROM_VERSION;
    uint8_t relay1;
    uint8_t relay2;
    uint8_t relay3;
    uint8_t relay4;
    uint8_t relay5;
    uint8_t relay6;
    uint8_t relay7;
    uint8_t relay8;
    uint8_t relay9;
    uint8_t relay10;
    uint8_t relay11;
    uint8_t relay12;
    uint8_t relay13;
    uint8_t relay14;
    uint8_t relay15;
    uint8_t relay16;
    uint8_t relay17;
    uint8_t relay18;
    uint8_t relay19;
    uint8_t relay20;
    uint8_t relay21;
    uint8_t relay22;
    uint8_t relay23;
    uint8_t relay24;
};
EepromMemoryStructure eepromMemory;

#ifdef USE_NCD_BOARD
bool tripped[4];
int debugTrips[4];
int minTrips = 5;
#endif

bool relay1 = false;

// Use primary serial over USB interface for logging output
// source: https://docs.particle.io/reference/device-os/firmware/photon/#logging
SerialLogHandler logHandler(LOG_LEVEL_ALL);

/*******************************************************************************
This function is called once at start up
*******************************************************************************/
void setup()
{
    Particle.variable("relaysState", relaysState);
    Particle.function("controlRelay", controlRelay);

#ifdef USE_NCD_BOARD
    relayController.setAddress(0, 0, 0);
#endif

#ifdef USE_PARTICLE_RELAY_SHIELD
    // Use myRelays.begin(2); if you have the square, white RelayShield (from the Core)
    // to use, just add a '2' between the parentheses in the code above.
    // .begin() sets up a couple of things and is necessary to use the rest of the functions
    myRelays.begin();
#endif

#ifdef USE_SINGLE_RELAY
    pinMode(MY_RELAY, OUTPUT);
#endif

    initRelaysState();

    readFromEeprom();

    // publish startup message with firmware version
    Particle.publish(APP_NAME, VERSION, PRIVATE);
    Serial.println(APP_NAME);
}

/*******************************************************************************
This function loops forever
*******************************************************************************/
void loop()
{
    // read the on board inputs
    refreshRelaysState();
}

/*******************************************************************************
Accepted commands are:
- on : turns on all relays
- off : turns off all relays
- 1on or 2on or 3on or 4on : turns on the relay you want
- 1off or 2off or 3off or 4off : turns it off
- 1momentary or 2momentary or 3momentary or 4momentary : pulses the relay on for MOMENTARY_TIMER msec

NOTES: it is NOT recommended to set MOMENTARY_TIMER to more than few seconds (maybe 2 seconds?).
       This delay is running in a cloud function call hence the request used to trigger it
        will hung for all that time.
       If you need the pulse to be longer, a different mechanism would need to be put in place.
       Example: set a flag here and take care of the pulse in the loop() function
*******************************************************************************/
int controlRelay(String command)
{

    // if the command is empty fail right away
    if (command.equals(""))
    {
        return -1;
    }

    if (command.equalsIgnoreCase("on"))
    {
        turnOnAllRelays();
        return 0;
    }

    if (command.equalsIgnoreCase("off"))
    {
        turnOffAllRelays();
        return 0;
    }

    //Relay Specific Command
    int relayNumber = command.substring(0, 1).toInt();
    Serial.print("relayNumber: ");
    Serial.println(relayNumber);
    String relayCommand = command.substring(1);
    Serial.print("relayCommand:");
    Serial.print(relayCommand);
    Serial.println(".");
    if (relayCommand.equalsIgnoreCase("on"))
    {
        Serial.println("Turning on relay");
        turnOnRelay(relayNumber);
        Serial.println("returning");
        return 0;
    }

    if (relayCommand.equalsIgnoreCase("off"))
    {
        turnOffRelay(relayNumber);
        return 0;
    }

    if (relayCommand.equalsIgnoreCase("momentary"))
    {
        turnOnRelay(relayNumber);
        delay(MOMENTARY_TIMER);
        turnOffRelay(relayNumber);
        return 0;
    }

    return -1;
}

/*******************************************************************************/
/*******************************************************************************/
/*******************          EEPROM FUNCTIONS         *************************/
/********  https://docs.particle.io/reference/firmware/photon/#eeprom         **/
/********                                                                     **/
/********  wear and tear discussion:                                          **/
/********  https://community.particle.io/t/eeprom-flash-wear-and-tear/23738/5 **/
/**                                                                           **/
/*******************************************************************************/
/*******************************************************************************/

/*******************************************************************************
 * Function Name  : readFromEeprom
 * Description    : retrieves the settings from the EEPROM memory
 * Return         : none
 
 NOTES: of course this code is not optimal if you are just using one relay
 (or less than 24, for that matter)
 *******************************************************************************/
void readFromEeprom()
{

    EepromMemoryStructure myObj;
    EEPROM.get(EEPROM_ADDRESS, myObj);

    //verify this eeprom was written before
    // if version is 255 it means the eeprom was never written in the first place, hence the
    // data just read with the previous EEPROM.get() is invalid and we will ignore it
    if (myObj.version == EEPROM_VERSION)
    {
        if (myObj.relay1)
        {
            turnOnRelay(1);
        }
        if (myObj.relay2)
        {
            turnOnRelay(2);
        }
        if (myObj.relay3)
        {
            turnOnRelay(3);
        }
        if (myObj.relay4)
        {
            turnOnRelay(4);
        }
        if (myObj.relay5)
        {
            turnOnRelay(5);
        }
        if (myObj.relay6)
        {
            turnOnRelay(6);
        }
        if (myObj.relay7)
        {
            turnOnRelay(7);
        }
        if (myObj.relay8)
        {
            turnOnRelay(8);
        }
        if (myObj.relay9)
        {
            turnOnRelay(9);
        }
        if (myObj.relay10)
        {
            turnOnRelay(10);
        }
        if (myObj.relay11)
        {
            turnOnRelay(11);
        }
        if (myObj.relay12)
        {
            turnOnRelay(12);
        }
        if (myObj.relay13)
        {
            turnOnRelay(13);
        }
        if (myObj.relay14)
        {
            turnOnRelay(14);
        }
        if (myObj.relay15)
        {
            turnOnRelay(15);
        }
        if (myObj.relay16)
        {
            turnOnRelay(16);
        }
        if (myObj.relay17)
        {
            turnOnRelay(17);
        }
        if (myObj.relay18)
        {
            turnOnRelay(18);
        }
        if (myObj.relay19)
        {
            turnOnRelay(19);
        }
        if (myObj.relay20)
        {
            turnOnRelay(20);
        }
        if (myObj.relay21)
        {
            turnOnRelay(21);
        }
        if (myObj.relay22)
        {
            turnOnRelay(22);
        }
        if (myObj.relay23)
        {
            turnOnRelay(23);
        }
        if (myObj.relay24)
        {
            turnOnRelay(24);
        }

        Particle.publish(APP_NAME, "Read settings from EEPROM", PRIVATE);
    }
}

/*******************************************************************************
 * Function Name  : saveSettingsInEeprom
 * Description    : save info to eeprom
                    Remember that each eeprom writing cycle is a precious and finite resource
 * Return         : none

 NOTES: of course this code is not optimal if you are just using one relay
 (or less than 24, for that matter)
 *******************************************************************************/
void saveSettingsInEeprom()
{

    //store data in the struct type that will be saved in the eeprom
    eepromMemory.version = EEPROM_VERSION;
    eepromMemory.relay1 = readRelayStatus(1);
    eepromMemory.relay2 = readRelayStatus(2);
    eepromMemory.relay3 = readRelayStatus(3);
    eepromMemory.relay4 = readRelayStatus(4);
    eepromMemory.relay5 = readRelayStatus(5);
    eepromMemory.relay6 = readRelayStatus(6);
    eepromMemory.relay7 = readRelayStatus(7);
    eepromMemory.relay8 = readRelayStatus(8);
    eepromMemory.relay9 = readRelayStatus(9);
    eepromMemory.relay10 = readRelayStatus(10);
    eepromMemory.relay11 = readRelayStatus(11);
    eepromMemory.relay12 = readRelayStatus(12);
    eepromMemory.relay13 = readRelayStatus(13);
    eepromMemory.relay14 = readRelayStatus(14);
    eepromMemory.relay15 = readRelayStatus(15);
    eepromMemory.relay16 = readRelayStatus(16);
    eepromMemory.relay17 = readRelayStatus(17);
    eepromMemory.relay18 = readRelayStatus(18);
    eepromMemory.relay19 = readRelayStatus(19);
    eepromMemory.relay20 = readRelayStatus(20);
    eepromMemory.relay21 = readRelayStatus(21);
    eepromMemory.relay22 = readRelayStatus(22);
    eepromMemory.relay23 = readRelayStatus(23);
    eepromMemory.relay24 = readRelayStatus(24);

    //then save
    EEPROM.put(EEPROM_ADDRESS, eepromMemory);

    Particle.publish(APP_NAME, "Stored settings on EEPROM", PRIVATE);
}

/*******************************************************************************
********************************************************************************
********************************************************************************
 RELAYS FUNCTIONS
********************************************************************************
********************************************************************************
*******************************************************************************/

/*******************************************************************************
 * Function Name  : refreshRelaysState
 * Description    : refresh the state of every relay in the cloud variable
 *******************************************************************************/
void refreshRelaysState()
{

    // is time up? no, then come back later
    if (relaysStateSampleInterval < RELAYS_STATE_SAMPLE_INTERVAL)
    {
        return;
    }

    //is time up, reset timer
    relaysStateSampleInterval = 0;

    String localRelaysState = "";

    // compose the string with every relay
    // if relay is active is a 1
    for (int i = 0; i < NUMBER_OF_RELAYS; i++)
    {
        if (readRelayStatus(i + 1))
        {
            localRelaysState = localRelaysState + "1";
        }
        else
        {
            localRelaysState = localRelaysState + "0";
        }
    }

    relaysState = localRelaysState;
}

/*******************************************************************************
 * Function Name  : initRelaysState
 * Description    : init the var state
 *******************************************************************************/
void initRelaysState()
{
    relaysState = "";

    for (int i = 0; i < NUMBER_OF_RELAYS; i++)
    {
        relaysState = relaysState + "0";
    }
}

/*******************************************************************************
 * Function Name  : turnOnRelay
 * Description    : wrapper to turn on a relay
 *******************************************************************************/
void turnOnRelay(int relay)
{
    if (relay > NUMBER_OF_RELAYS)
    {
        return;
    }

#ifdef USE_NCD_BOARD
    relayController.turnOnRelay(relay);
#endif
#ifdef USE_PARTICLE_RELAY_SHIELD
    myRelays.on(relay);
#endif
#ifdef USE_SINGLE_RELAY
    digitalWrite(MY_RELAY, HIGH);
    relay1 = true;
#endif
}

/*******************************************************************************
 * Function Name  : turnOffRelay
 * Description    : wrapper to turn off a relay
 *******************************************************************************/
void turnOffRelay(int relay)
{
    if (relay > NUMBER_OF_RELAYS)
    {
        return;
    }

#ifdef USE_NCD_BOARD
    relayController.turnOffRelay(relay);
#endif
#ifdef USE_PARTICLE_RELAY_SHIELD
    myRelays.off(relay);
#endif
#ifdef USE_SINGLE_RELAY
    digitalWrite(MY_RELAY, LOW);
    relay1 = false;
#endif
}

/*******************************************************************************
 * Function Name  : readRelayStatus
 * Description    : returns the status of a relay: 1 is ON, 0 is OFF
 *******************************************************************************/
int readRelayStatus(int relay)
{
    if (relay > NUMBER_OF_RELAYS)
    {
        return 0;
    }

#ifdef USE_NCD_BOARD
    return relayController.readRelayStatus(relay);
#endif
#ifdef USE_PARTICLE_RELAY_SHIELD
    if (myRelays.isOn(relay))
    {
        return 1;
    }
    return 0;
#endif
#ifdef USE_SINGLE_RELAY
    if (relay1)
    {
        return 1;
    }
    return 0;
#endif
}

/*******************************************************************************
 * Function Name  : turnOnAllRelays
 * Description    : wrapper to turn on all relays
 *******************************************************************************/
void turnOnAllRelays()
{
#ifdef USE_NCD_BOARD
    relayController.turnOnAllRelays();
#endif
#ifdef USE_PARTICLE_RELAY_SHIELD
    myRelays.allOn();
#endif
#ifdef USE_SINGLE_RELAY
    turnOnRelay(1);
#endif
}

/*******************************************************************************
 * Function Name  : turnOffAllRelays
 * Description    : wrapper to turn off all relays
 *******************************************************************************/
void turnOffAllRelays()
{
#ifdef USE_NCD_BOARD
    relayController.turnOffAllRelays();
#endif
#ifdef USE_PARTICLE_RELAY_SHIELD
    myRelays.allOff();
#endif
#ifdef USE_SINGLE_RELAY
    turnOffRelay(1);
#endif
}
