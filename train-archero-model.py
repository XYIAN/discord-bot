#!/usr/bin/env python3
"""
Archero 2 Bot - Local Model Training
Fine-tune a small model for Archero 2 Q&A
"""

import json
import os
from pathlib import Path
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import torch

class ArcheroTrainer:
    def __init__(self):
        self.model_name = "microsoft/DialoGPT-small"  # Small, fast model
        self.tokenizer = None
        self.model = None
        self.training_data = []
        
    def load_archero_data(self):
        """Load and clean Archero 2 data for training"""
        print("📚 Loading Archero 2 training data...")
        
        # Load real game facts
        real_facts_file = Path("data/real-archero2-facts.json")
        if real_facts_file.exists():
            with open(real_facts_file, 'r') as f:
                data = json.load(f)
            
            # Convert to Q&A format
            for category, facts in data.items():
                for key, content in facts.items():
                    # Create questions and answers
                    if category == "weapons":
                        questions = [
                            f"What are the best weapons in Archero 2?",
                            f"Tell me about {key.replace('_', ' ')}",
                            f"What weapons should I use?"
                        ]
                    elif category == "mixed_gear_sets":
                        questions = [
                            f"How do mixed gear sets work?",
                            f"Tell me about gear sets",
                            f"What are the benefits of mixed gear?"
                        ]
                    elif category == "pvp_characters":
                        questions = [
                            f"Which characters are best for PvP?",
                            f"Tell me about {key.replace('_', ' ')}",
                            f"What characters should I use in arena?"
                        ]
                    elif category == "arena":
                        questions = [
                            f"How does Peak Arena work?",
                            f"Tell me about arena strategy",
                            f"What are the arena rules?"
                        ]
                    elif category == "guild":
                        questions = [
                            f"What are XYIAN guild requirements?",
                            f"Tell me about guild benefits",
                            f"How do I join XYIAN?"
                        ]
                    else:
                        questions = [f"Tell me about {key.replace('_', ' ')}"]
                    
                    for question in questions:
                        self.training_data.append({
                            "question": question,
                            "answer": content,
                            "category": category
                        })
        
        print(f"✅ Loaded {len(self.training_data)} training examples")
        return self.training_data
    
    def create_training_dataset(self):
        """Create training dataset in the right format"""
        print("🔄 Creating training dataset...")
        
        # Format as conversations for DialoGPT
        conversations = []
        for item in self.training_data:
            conversation = f"User: {item['question']}\nXY Elder: {item['answer']}"
            conversations.append(conversation)
        
        # Create dataset
        dataset = Dataset.from_dict({"text": conversations})
        
        # Tokenize
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        def tokenize_function(examples):
            return self.tokenizer(
                examples["text"], 
                truncation=True, 
                padding=True, 
                max_length=512
            )
        
        tokenized_dataset = dataset.map(tokenize_function, batched=True)
        
        return tokenized_dataset
    
    def train_model(self, dataset):
        """Train the model"""
        print("🚀 Starting model training...")
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(self.model_name)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir="./archero-model",
            overwrite_output_dir=True,
            num_train_epochs=3,
            per_device_train_batch_size=4,
            per_device_eval_batch_size=4,
            warmup_steps=100,
            logging_steps=10,
            save_steps=500,
            evaluation_strategy="no",
            save_total_limit=2,
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator,
        )
        
        # Train
        trainer.train()
        
        # Save model
        trainer.save_model()
        self.tokenizer.save_pretrained("./archero-model")
        
        print("✅ Model training complete! Saved to ./archero-model")
    
    def test_model(self, question):
        """Test the trained model"""
        if not self.model or not self.tokenizer:
            print("❌ Model not loaded. Train first.")
            return
        
        # Load trained model
        self.model = AutoModelForCausalLM.from_pretrained("./archero-model")
        self.tokenizer = AutoTokenizer.from_pretrained("./archero-model")
        
        # Generate response
        prompt = f"User: {question}\nXY Elder:"
        inputs = self.tokenizer.encode(prompt, return_tensors="pt")
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_length=200,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response

def main():
    print("🎮 Archero 2 Bot - Local Model Training")
    print("=" * 50)
    
    trainer = ArcheroTrainer()
    
    # Load data
    training_data = trainer.load_archero_data()
    if not training_data:
        print("❌ No training data found!")
        return
    
    # Create dataset
    dataset = trainer.create_training_dataset()
    
    # Train model
    trainer.train_model(dataset)
    
    # Test model
    print("\n🧪 Testing trained model...")
    test_questions = [
        "What are the best weapons in Archero 2?",
        "How do mixed gear sets work?",
        "Which characters are best for PvP?"
    ]
    
    for question in test_questions:
        print(f"\nQ: {question}")
        response = trainer.test_model(question)
        print(f"A: {response}")

if __name__ == "__main__":
    main()
