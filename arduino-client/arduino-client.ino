#include <ArduinoHttpClient.h>
#include <Arduino_JSON.h>
#include <Ethernet.h>
#include <SPI.h>

EthernetClient ethClient;
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

/*
 *
 * Logging Level Cheatsheet
 *
 * 0 = DEBUG
 * 1 = INFO
 * 2 = WARN
 * 3 = ERROR
 *
 */

bool serialPrintingEnabled = true;
int loggingLevel = 0;

const int LM35 = A0;

void logMessage(String message, int level = 1)
{

  if (level < loggingLevel || !serialPrintingEnabled || !Serial)
  {
    return;
  }

  String levelString = "DEBUG";

  if (level == 1)
  {
    levelString = "INFO";
  }
  else if (level == 2)
  {
    levelString = "WARN";
  }
  else if (level >= 3)
  {
    levelString = "ERROR";
  }

  Serial.println("[" + levelString + "]: " + message);
}

void hang(String message)
{
  logMessage("Program Hanged: " + message, 2);
  while (true)
    ;
}

int makeRequest(String body)
{
  logMessage("Request payload:", 0);
  logMessage(body, 0);

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

  for (int i = 0; i < 10; i++)
  {
    temperature += readLM35();
    delay(5);
  }

  temperature = temperature / 10.0;
  logMessage("End Temp = " + String(temperature) + "C", 0);

  return temperature;
}

JSONVar readSensors()
{
  JSONVar values;

  values["room_temperature"] = readTemperature();

  return values;
}

void (*resetBoard)(void) = 0;

void setup()
{
  pinMode(LM35, INPUT);

  if (serialPrintingEnabled)
  {
    Serial.begin(9600);
    while (!Serial)
      ;
    logMessage("Serial initialized.", 0);
  }

  Ethernet.begin(mac);

  logMessage("Waiting for ethernet to init...", 0);
  delay(1000);

  if (Ethernet.hardwareStatus() == EthernetNoHardware)
  {
    hang("EthNoHW");
  }

  if (Ethernet.linkStatus() == LinkOFF)
  {
    hang("LOFF");
  }
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
      logMessage("Stopping new attemtps after 10 unsuccesfull calls", 3);
      break;
    }

    if (attempt > 1)
    {
      logMessage("Last request unsuccessful. Status code: " + String(responseCode), 2);
      logMessage("Waiting a little before retrying...", 0);
      delay(1000);
      logMessage("Starting attempt number " + String(attempt), 2);
    }

    logMessage("Making POST request", 1);
    responseCode = makeRequest(JSON.stringify(readings));
    logMessage("status code: " + String(responseCode), 1);
    attempt++;

  } while (responseCode != 200);

  if (responseCode < 0)
  {
    logMessage("*** Resetting board ***", 2);
    resetBoard();
  }

  attempt = 1;
  logMessage("Waiting...", 0);
  delay(30000);
}
