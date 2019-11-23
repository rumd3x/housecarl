#include <ArduinoHttpClient.h>
#include <Arduino_JSON.h>
#include <Ethernet.h>
#include <SPI.h>

EthernetClient ethClient;
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

#define LEVEL_DEBUG 0
#define LEVEL_INFO 1
#define LEVEL_WARN 2
#define LEVEL_ERROR 3

#define loggingLevel LEVEL_DEBUG
#define serialPrintingEnabled true

#define LM35 A0
#define LDR 8
#define PIR 9

void logMessage(String message, int level = LEVEL_INFO)
{

  if (level < loggingLevel || !serialPrintingEnabled || !Serial)
  {
    return;
  }

  String levelString = "DEBUG";

  if (level == LEVEL_INFO)
  {
    levelString = "INFO";
  }
  else if (level == LEVEL_WARN)
  {
    levelString = "WARN";
  }
  else if (level >= LEVEL_ERROR)
  {
    levelString = "ERROR";
  }

  Serial.println("[" + levelString + "]: " + message);
}

void hang(String message)
{
  logMessage("Program Hanged: " + message, LEVEL_WARN);
  while (true);
}

int makeRequest(String body)
{
  logMessage("Request payload:", LEVEL_DEBUG);
  logMessage(body, LEVEL_DEBUG);

  HttpClient httpClient = HttpClient(ethClient, "webhook.site", 80);
  httpClient.post("/73eb4add-bdae-4a53-a4fe-4de78cd19b1f", "application/json", body);

  return httpClient.responseStatusCode();
}

float readLM35()
{
  int iterations = 10;

  int sensorAvg = 0;
  int samples[iterations];
  int combo = 0;

  for (int i = 0; i < iterations; i++)
  {
    do
    {
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

  for (int i = 0; i < 100; i++)
  {
    temperature += readLM35();
    delay(5);
  }

  temperature = temperature / 100.0;
  logMessage("End Temp = " + String(temperature) + "C", LEVEL_DEBUG);

  return temperature;
}

JSONVar readSensors()
{
  JSONVar values;

  logMessage("Starting sensor readings", LEVEL_DEBUG);
  
  values["room_temperature"] = readTemperature();
  values["room_luminosity"] = digitalRead(LDR) == LOW;
  values["room_movement"] = digitalRead(PIR) == HIGH;

  return values;
}

void (*resetBoard)(void) = 0;

void setup()
{
  pinMode(LM35, INPUT);
  pinMode(LDR, INPUT);
  pinMode(PIR, INPUT);

  if (serialPrintingEnabled)
  {
    Serial.begin(9600);
    while (!Serial);
    logMessage("Serial ok", LEVEL_DEBUG);
  }

  Ethernet.begin(mac);

  logMessage("Waiting for ethernet to init", LEVEL_DEBUG);
  delay(1000);

  if (Ethernet.hardwareStatus() == EthernetNoHardware)
  {
    hang("EthNoHW");
  }

  if (Ethernet.linkStatus() == LinkOFF)
  {
    hang("LOFF");
  }

  logMessage("Setup succesfull!", LEVEL_DEBUG);
}

void loop()
{
  int attempt = 1;
  int responseCode;

  JSONVar readings = readSensors();

  do
  {

    if (attempt > 10)
    {
      logMessage("Stopping new attemtps after 10 unsuccesfull calls", LEVEL_ERROR);
      break;
    }

    if (attempt > 1)
    {
      logMessage("Last request unsuccessful. Status code: " + String(responseCode), LEVEL_WARN);
      logMessage("Waiting a little before retrying...", LEVEL_DEBUG);
      delay(1000);
      logMessage("Starting attempt number " + String(attempt), LEVEL_WARN);
    }

    logMessage("Making POST request", LEVEL_INFO);
    responseCode = makeRequest(JSON.stringify(readings));
    logMessage("status code: " + String(responseCode), LEVEL_INFO);
    attempt++;

  } while (responseCode != 200);

  if (responseCode < 0)
  {
    logMessage("*** Resetting board ***", LEVEL_WARN);
    resetBoard();
  }

  attempt = 1;
  logMessage("Waiting...", LEVEL_DEBUG);
  delay(5000);
}
