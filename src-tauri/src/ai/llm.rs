// LLM client for IntelliWork.
//
// Supports multiple AI providers for classification fallback
// and summary generation: OpenAI, Google Gemini, Ollama (local).

use super::errors::AiError;

use serde::{Deserialize, Serialize};

/// Supported AI providers.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AiProvider {
    /// Rule-based only (no API calls)
    RuleBased,
    /// OpenAI GPT models
    OpenAI,
    /// Google Gemini models
    Gemini,
    /// Ollama (local, self-hosted)
    Ollama,
}

impl AiProvider {
    /// Parse a provider string from config.
    pub fn from_str_safe(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "openai" => AiProvider::OpenAI,
            "gemini" => AiProvider::Gemini,
            "ollama" => AiProvider::Ollama,
            _ => AiProvider::RuleBased,
        }
    }

    /// Whether this provider requires an API key.
    pub fn requires_api_key(&self) -> bool {
        matches!(self, AiProvider::OpenAI | AiProvider::Gemini)
    }

    /// Whether this provider runs locally (no data leaves the machine).
    pub fn is_local(&self) -> bool {
        matches!(self, AiProvider::RuleBased | AiProvider::Ollama)
    }
}

/// Configuration for the LLM client.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: AiProvider,
    pub api_key: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
    pub timeout_seconds: u64,
    pub max_tokens: u32,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            provider: AiProvider::RuleBased,
            api_key: None,
            model: "gpt-4o-mini".to_string(),
            base_url: None,
            timeout_seconds: 30,
            max_tokens: 1024,
        }
    }
}

/// LLM client for AI-powered features.
///
/// Currently a configuration holder. Actual HTTP calls will be
/// implemented when cloud AI features are enabled.
pub struct LlmClient {
    config: LlmConfig,
}

impl LlmClient {
    /// Create a new LLM client.
    pub fn new(config: LlmConfig) -> Self {
        Self { config }
    }

    /// Get the configured provider.
    pub fn provider(&self) -> &AiProvider {
        &self.config.provider
    }

    /// Check if the client is configured and ready.
    pub fn is_ready(&self) -> bool {
        match self.config.provider {
            AiProvider::RuleBased => true,
            AiProvider::Ollama => true, // No API key needed
            AiProvider::OpenAI | AiProvider::Gemini => {
                self.config.api_key.is_some()
            }
        }
    }

    /// Send a prompt to the configured LLM and get a response.
    ///
    /// Returns the LLM response text or an error.
    pub async fn complete(&self, prompt: &str) -> Result<String, AiError> {
        match self.config.provider {
            AiProvider::RuleBased => {
                Err(AiError::NotConfigured(
                    "Rule-based provider does not support LLM completion".to_string(),
                ))
            }
            AiProvider::OpenAI => {
                self.call_openai(prompt).await
            }
            AiProvider::Gemini => {
                self.call_gemini(prompt).await
            }
            AiProvider::Ollama => {
                self.call_ollama(prompt).await
            }
        }
    }

    /// Call OpenAI API.
    async fn call_openai(&self, prompt: &str) -> Result<String, AiError> {
        let api_key = self.config.api_key.as_ref().ok_or_else(|| {
            AiError::NotConfigured("OpenAI API key not set".to_string())
        })?;

        let url = self
            .config
            .base_url
            .as_deref()
            .unwrap_or("https://api.openai.com/v1/chat/completions");

        let body = serde_json::json!({
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": "You are a work activity classifier. Respond with JSON only."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": self.config.max_tokens,
            "temperature": 0.3,
        });

        let client = reqwest::Client::new();
        let response = client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .timeout(std::time::Duration::from_secs(self.config.timeout_seconds))
            .json(&body)
            .send()
            .await
            .map_err(|e| AiError::LlmApiError(e.to_string()))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AiError::InvalidResponse(e.to_string()))?;

        json["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AiError::InvalidResponse("No content in response".to_string()))
    }

    /// Call Google Gemini API.
    async fn call_gemini(&self, prompt: &str) -> Result<String, AiError> {
        let api_key = self.config.api_key.as_ref().ok_or_else(|| {
            AiError::NotConfigured("Gemini API key not set".to_string())
        })?;

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            self.config.model, api_key
        );

        let body = serde_json::json!({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": self.config.max_tokens,
                "temperature": 0.3,
            }
        });

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Content-Type", "application/json")
            .timeout(std::time::Duration::from_secs(self.config.timeout_seconds))
            .json(&body)
            .send()
            .await
            .map_err(|e| AiError::LlmApiError(e.to_string()))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AiError::InvalidResponse(e.to_string()))?;

        json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AiError::InvalidResponse("No text in Gemini response".to_string()))
    }

    /// Call Ollama API (local).
    async fn call_ollama(&self, prompt: &str) -> Result<String, AiError> {
        let url = self
            .config
            .base_url
            .as_deref()
            .unwrap_or("http://localhost:11434/api/generate");

        let body = serde_json::json!({
            "model": self.config.model,
            "prompt": prompt,
            "stream": false,
        });

        let client = reqwest::Client::new();
        let response = client
            .post(url)
            .header("Content-Type", "application/json")
            .timeout(std::time::Duration::from_secs(self.config.timeout_seconds))
            .json(&body)
            .send()
            .await
            .map_err(|e| AiError::LlmApiError(e.to_string()))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AiError::InvalidResponse(e.to_string()))?;

        json["response"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AiError::InvalidResponse("No response from Ollama".to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_parsing() {
        assert_eq!(AiProvider::from_str_safe("openai"), AiProvider::OpenAI);
        assert_eq!(AiProvider::from_str_safe("gemini"), AiProvider::Gemini);
        assert_eq!(AiProvider::from_str_safe("ollama"), AiProvider::Ollama);
        assert_eq!(AiProvider::from_str_safe("rule_based"), AiProvider::RuleBased);
        assert_eq!(AiProvider::from_str_safe("unknown"), AiProvider::RuleBased);
    }

    #[test]
    fn test_requires_api_key() {
        assert!(AiProvider::OpenAI.requires_api_key());
        assert!(AiProvider::Gemini.requires_api_key());
        assert!(!AiProvider::Ollama.requires_api_key());
        assert!(!AiProvider::RuleBased.requires_api_key());
    }

    #[test]
    fn test_is_local() {
        assert!(AiProvider::RuleBased.is_local());
        assert!(AiProvider::Ollama.is_local());
        assert!(!AiProvider::OpenAI.is_local());
        assert!(!AiProvider::Gemini.is_local());
    }

    #[test]
    fn test_default_config() {
        let config = LlmConfig::default();
        assert_eq!(config.provider, AiProvider::RuleBased);
        assert!(config.api_key.is_none());
        assert_eq!(config.timeout_seconds, 30);
    }

    #[test]
    fn test_client_ready_rule_based() {
        let client = LlmClient::new(LlmConfig::default());
        assert!(client.is_ready());
    }

    #[test]
    fn test_client_not_ready_without_key() {
        let config = LlmConfig {
            provider: AiProvider::OpenAI,
            api_key: None,
            ..LlmConfig::default()
        };
        let client = LlmClient::new(config);
        assert!(!client.is_ready());
    }

    #[test]
    fn test_client_ready_with_key() {
        let config = LlmConfig {
            provider: AiProvider::OpenAI,
            api_key: Some("sk-test-key".to_string()),
            ..LlmConfig::default()
        };
        let client = LlmClient::new(config);
        assert!(client.is_ready());
    }
}
