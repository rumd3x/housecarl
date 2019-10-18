#include <SPI.h>
#include <Ethernet.h>
#include <ArduinoHttpClient.h>

byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};

EthernetClient ethClient;

void setup()
{
  // hang("Perae!");
  
  Serial.begin(9600);
  while (!Serial);
  
  pinMode(LED_BUILTIN, OUTPUT);
    
  Ethernet.begin(mac);
  
  Serial.println("Waiting for ethernet to init...");
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
  Serial.println("Making POST request");
  
  HttpClient httpClient = HttpClient(ethClient, "webhook.site", 80);

  
  String contentType = "application/x-www-form-urlencoded";
  String postData = "name=Alice&age=12";

  httpClient.post("/9fa843d5-d5d6-452e-949f-84874fac57b5", contentType, postData);

  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  
  Serial.println();
  Serial.println("Response: ");
  Serial.println(response);

//  Serial.println();
//  Serial.println("Wait 10 seconds...");
//  delay(10000);

  Serial.println();
}

void hang(String message) {
  if (Serial) {
    Serial.println(message);
  }

  while(true) {
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    delay(650);
  }
}
