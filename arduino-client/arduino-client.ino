#include <ArduinoHttpClient.h>
#include <Ethernet.h>
#include <SPI.h>

#define LEVEL_DEBUG 0
#define LEVEL_INFO 1
#define LEVEL_WARN 2
#define LEVEL_ERROR 3

#define serialPrintingEnabled false
#define remoteLoggingEnabled true

#define LM35 A0
#define LDR 8
#define PIR 9

const String loggerPath = "/api/logs";
const String sensorStoragePath = "/api/sensors";
const String configurationPath = "/api/config/";

const String loggingLevelSetting = "LOGGING_LEVEL";

int loggingLevel = LEVEL_INFO;

byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

EthernetClient ethClient;
HttpClient httpClient = HttpClient(ethClient, "192.168.1.3", 3000);

void (*resetBoard)(void) = 0;

void printSerial(String message, int level)
{
  String levelString = "DEBUG";

  if (level == LEVEL_INFO) {
    levelString = "INFO";
  }
  else if (level == LEVEL_WARN) {
    levelString = "WARN";
  }
  else if (level >= LEVEL_ERROR) {
    levelString = "ERROR";
  }

  Serial.println("[" + levelString + "]: " + message);
}

int makeRequest(String body, String path)
{

  httpClient.post(path, "application/json", body);

  int responseCode = httpClient.responseStatusCode();
  httpClient.responseBody();

  if (responseCode < 0) {
    resetBoard();
  }

  return responseCode;
}

void sendLogsToCloud(String message, int level)
{
  String logObject = "{";
  logObject += "\"message\":\"" + String(message) + "\"";
  logObject += ",\"level\":" + String(level);
  logObject += "}";

  makeRequest(logObject, loggerPath);
}

void logMessage(String message, int level)
{

  if (level < loggingLevel) {
    return;
  }

  if (serialPrintingEnabled && Serial) {
    printSerial(message, level);
  }

  if (remoteLoggingEnabled) {
    sendLogsToCloud(message, level);
  }
}

String getCloudSetting(String setting, String def)
{

  httpClient.get(configurationPath + setting);

  if (httpClient.responseStatusCode() < 0) {
    resetBoard();
  }

  String response = httpClient.responseBody();

  if (response == "unset") {
    logMessage("f=getCloudSetting;message=unset;setting=" + String(response), LEVEL_WARN);
    return def;
  }

  return response;
}

void hang(String message)
{
  logMessage("f=hang;message=" + message, LEVEL_WARN);
  while (true);
}

bool sendSensorReadings(String readings)
{
  logMessage("f=sendSensorReadings;message=Starting request", LEVEL_INFO);
  int responseCode = makeRequest(readings, sensorStoragePath);

  logMessage("f=sendSensorReadings;responseCode=" + String(responseCode), LEVEL_INFO);
  return responseCode == 200;
}

float readLM35()
{
  int iterations = 10;

  int sensorAvg = 0;
  int samples[iterations];
  int combo = 0;

  for (int i = 0; i < iterations; i++) {
    do {
      samples[i] = analogRead(LM35);
    } while (samples[i] <= 20);

    sensorAvg += samples[i];
  }

  sensorAvg = sensorAvg / iterations;

  float tempInCelsius = (samples[0] * 0.0048875855) * 100;

  return tempInCelsius;
}

float readTemperature()
{
  float temperature = 0;

  for (int i = 0; i < 100; i++) {
    temperature += readLM35();
    delay(5);
  }

  temperature = temperature / 100.0;
  logMessage("f=readTemperature;temperature=" + String(temperature), LEVEL_DEBUG);

  return temperature;
}

bool lastPirReading = false;
bool readMovement()
{
  bool currentReading = (digitalRead(PIR) == HIGH);
  bool constantlyMoving = (currentReading && lastPirReading);
  lastPirReading = currentReading;

  return constantlyMoving;
}

String readSensors()
{

  logMessage("f=readSensors;message=Starting sensor readings", LEVEL_DEBUG);

  String encodedReadings = "{";
  encodedReadings += "\"room_temperature\":" + String(readTemperature());
  encodedReadings += ",\"room_luminosity\":" + String(digitalRead(LDR) == LOW);
  encodedReadings += ",\"room_movement\":" + String(readMovement());
  encodedReadings += "}";

  return encodedReadings;
}

void setup()
{
  pinMode(LM35, INPUT);
  pinMode(LDR, INPUT);
  pinMode(PIR, INPUT);

  if (serialPrintingEnabled) {
    Serial.begin(9600);
    while (!Serial);
    Serial.println("serial ok");
  }

  Ethernet.begin(mac);
  delay(1000);

  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    hang("EthNoHW");
  }

  if (Ethernet.linkStatus() == LinkOFF) {
    hang("LOFF");
  }

  loggingLevel = getCloudSetting(loggingLevelSetting, String(LEVEL_INFO)).toInt();
  logMessage("f=loop;message=Set logging level: " + String(loggingLevel), LEVEL_INFO);

  logMessage("f=setup;message=Setup ok;", LEVEL_DEBUG);
}

void loop()
{  
  int attempt = 1;
  String encodedReadings = readSensors();
  bool sentReadingsSuccessfully = false;

  do {

    int attemptLevel = LEVEL_INFO;
    if (attempt > 1) {
      attemptLevel = LEVEL_WARN;
    }
    logMessage("f=loop;message=Attempt " + String(attempt), attemptLevel);

    sentReadingsSuccessfully = sendSensorReadings(encodedReadings);
    attempt++;

  } while (!sentReadingsSuccessfully && attempt <= 10);

  if (!sentReadingsSuccessfully) {
    logMessage("f=loop;message=Failed to send readings", LEVEL_ERROR);
  }
}
