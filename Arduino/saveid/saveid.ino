#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 53 // Slave Select pin
#define RST_PIN 5 // Reset pin

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

String userId = "68eabd3b33c308829b64efe4"; // 24 characters
const byte block1 = 4;
const byte block2 = 5;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();

  Serial.println("=======================================");
  Serial.println("   RFID User ID Writer - Gettz Fitness");
  Serial.println("=======================================");
  Serial.println("Place your RFID card near the reader...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    return;

  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  // Authenticate for both blocks
  MFRC522::StatusCode status;
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block1, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.println("Auth failed for block 4");
    return;
  }

  // Split userId into 2 parts
  byte buffer1[16];
  byte buffer2[16];
  memset(buffer1, 0, 16);
  memset(buffer2, 0, 16);
  for (int i = 0; i < 16 && i < userId.length(); i++)
    buffer1[i] = userId[i];
  for (int i = 16; i < userId.length(); i++)
    buffer2[i - 16] = userId[i];

  // Write block 4
  status = rfid.MIFARE_Write(block1, buffer1, 16);
  if (status == MFRC522::STATUS_OK)
    Serial.println("✅ Part 1 written (block 4)");
  else
    Serial.println("❌ Write failed block 4");

  // Write block 5
  status = rfid.MIFARE_Write(block2, buffer2, 16);
  if (status == MFRC522::STATUS_OK)
    Serial.println("✅ Part 2 written (block 5)");
  else
    Serial.println("❌ Write failed block 5");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  Serial.println("Remove card, place next one...");
  delay(2000);
}
