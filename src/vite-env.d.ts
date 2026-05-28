/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MQTT_USER: string;
  readonly VITE_MQTT_PASS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
