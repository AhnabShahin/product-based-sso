<?php

namespace ProductBasedSSO\Traits;

if (!defined('ABSPATH')) {
    exit;
}

class EncryptionTrait
{
    /**
     * Decrypt a CryptoJS AES-encrypted token string
     *
     * @param string $token  Token string that starts with "AES-"
     * @param string $secret Secret passphrase
     * @return mixed         Decrypted JSON object, string, or false on failure
     */
    public static function decrypt(string $token, string $secret)
    {
        if (empty($token) || !str_starts_with($token, 'AES-')) {
            return false;
        }

        $encryptedString = explode('-', $token, 2)[1] ?? '';
        if (empty($encryptedString)) {
            return false;
        }

        try {
            $decoded = base64_decode($encryptedString);
            if ($decoded === false) {
                return false;
            }

            $json = json_decode($decoded, true);
            if (
                !$json ||
                !isset($json['salt'], $json['iv'], $json['ciphertext'])
            ) {
                return false;
            }

            $salt = hex2bin($json['salt']);
            $iv = hex2bin($json['iv']);
            $ciphertext = base64_decode($json['ciphertext']);
            $iterations = isset($json['iterations']) && intval($json['iterations']) > 0
                ? intval($json['iterations'])
                : 999;

            if ($salt === false || $iv === false || $ciphertext === false) {
                return false;
            }

            // AES-256 => 256-bit key => 32 bytes
            $keyLength = 256 / 8;

            // Derive key using PBKDF2 with SHA1
            $key = hash_pbkdf2('sha1', $secret, $salt, $iterations, $keyLength, true);

            // Decrypt with AES-256-CBC
            $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

            if ($decrypted === false) {
                return false;
            }

            $decrypted = rtrim($decrypted, "\0");

            $jsonDecoded = json_decode($decrypted, true);
            return $jsonDecoded ?? $decrypted;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Encrypt data using AES encryption compatible with CryptoJS
     *
     * @param mixed  $data   Data to encrypt (string, array, or object)
     * @param string $secret Secret passphrase
     * @return string|false  Encrypted token string with "AES-" prefix, or false on failure
     */
    public static function encrypt($data, string $secret)
    {
        try {
            // Convert data to JSON string if it's an object or array
            if (is_array($data) || is_object($data)) {
                $dataString = json_encode($data);
            } else {
                $dataString = (string) $data;
            }

            // Generate random salt and IV (128 bits = 16 bytes)
            $salt = openssl_random_pseudo_bytes(16);
            $iv = openssl_random_pseudo_bytes(16);

            // Key derivation parameters
            $iterations = 999;
            $keyLength = 256 / 8; // 256 bits = 32 bytes

            // Derive key using PBKDF2 with SHA1
            $key = hash_pbkdf2('sha1', $secret, $salt, $iterations, $keyLength, true);

            // Encrypt using AES-256-CBC
            $encrypted = openssl_encrypt(
                $dataString,
                'aes-256-cbc',
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );

            if ($encrypted === false) {
                return false;
            }

            // Create output object with all needed parameters for decryption
            $result = [
                'ciphertext' => base64_encode($encrypted),
                'salt' => bin2hex($salt),
                'iv' => bin2hex($iv),
                'iterations' => $iterations
            ];

            // Base64 encode the entire object
            $encryptedString = base64_encode(json_encode($result));

            // Add a prefix to identify the token type
            return 'AES-' . $encryptedString;
        } catch (\Exception $e) {
            return false;
        }
    }
}
