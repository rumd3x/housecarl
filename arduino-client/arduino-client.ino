#include <SPI.h>
#include <Ethernet.h>
#include <ArduinoHttpClient.h>

byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
bool serialPrintingEnabled = true;

EthernetClient ethClient;


void logMessage(String message, int level = 1) {
  
  if (serialPrintingEnabled && Serial) {
    String levelString = "DEBUG";
    
    if (level == 1) {
      levelString = "INFO";
    } else if (level == 2) {
      levelString = "WARN";
    } else if (level >= 3) {
      levelString = "ERROR";
    }
    
    Serial.println("[" + levelString + "]: " + message);
  }
  
}

void hang(String message) {
  logMessage("Program Hanged: " + message, 2);
  while(true);
}

HttpClient makeRequest(String body) {  
  HttpClient httpClient = HttpClient(ethClient, "webhook.site", 80);
  httpClient.post("/73eb4add-bdae-4a53-a4fe-4de78cd19b1f", "application/json", body);
  return httpClient;
}

void setup()
{ 
  if (serialPrintingEnabled) {
    Serial.begin(9600);
    while (!Serial);
    logMessage("Serial initialized.");
  }
    
  Ethernet.begin(mac);
  
  logMessage("Waiting for ethernet to init...");
  delay(1000);
  
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    hang("EthNoHW");
  }

  if (Ethernet.linkStatus() == LinkOFF) {
    hang("LOFF");
  }
}

void loop()
{
  String body = "{\"balls\": \"wall\"}";
  int attempt = 1;
  int responseCode = 0;
  
  
  do {
    
    if (attempt > 10) {
      logMessage("Stopping new attemtps after 10 unsuccesfull calls", 3);
      break;
    }
    
    if (attempt > 1) {
      logMessage("Last request unsuccessfull. Status code: " + String(responseCode), 2);
      logMessage("Starting attempt number " + String(attempt), 2);
    }
    
    logMessage("Making POST request");
    HttpClient response = makeRequest(body);
    responseCode = response.responseStatusCode();
    logMessage("status code: " + String(responseCode));
    
    attempt++;
    
  } while (responseCode != 200);

  attempt = 1;  
  logMessage("Waiting 30s...");
  delay(30000);
}
