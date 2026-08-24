# 🤖 AI-Based Question Paper Analyzer & Generator

An AI-powered full-stack web application that analyzes question papers against a syllabus and learning objectives, evaluates question difficulty and cognitive level, and generates new question papers based on selected requirements.

The project combines **React, Python Flask, MongoDB, PyMuPDF, and multiple AI APIs** to provide an interactive educational assessment platform.

---

## 📌 Overview

Creating and evaluating question papers manually can be time-consuming, especially when educators need to check:

- Question difficulty
- Syllabus coverage
- Learning-objective alignment
- Cognitive complexity
- Estimated solving time
- Overall balance of an examination paper

This project aims to simplify that process by using AI to analyze existing question papers and generate new assessments.

The application provides two primary capabilities:

1. **Question Paper Analyzer**
2. **AI Question Paper Generator**

---

## ✨ Features

### 📊 Question Paper Analysis

Upload a syllabus and question paper PDF and receive AI-generated analysis including:

- Difficulty score
- Syllabus alignment
- Bloom's Taxonomy classification
- Application depth
- Complexity index
- Estimated solving time
- Question type
- Topic coverage
- Difficulty distribution
- Overall paper-level analysis

The system can display the results using charts, summary cards, and detailed question-level metrics.

---

### 📝 AI Question Paper Generator

Generate new questions based on:

- Uploaded syllabus
- Learning objectives
- Selected topics
- Question type
- Difficulty level
- Selected AI model

Supported question types:

- Assignment
- Multiple Choice Questions (MCQs)
- Case Studies

Supported difficulty levels:

- Easy
- Moderate
- Tough

The generator uses different prompting strategies depending on the selected difficulty and question type.

---

### 🤖 Multiple AI Model Support

The backend is designed with an AI-service abstraction layer that supports multiple providers:

- Google Gemini
- OpenAI
- OpenRouter
- Groq
- HuggingFace

The application uses a common interface for communicating with different AI services and allows the selected model to be configured through environment variables.

---

### 📄 PDF Processing

The application uses **PyMuPDF** to extract text from uploaded PDF documents.

The extracted content is then processed before being sent to an AI model.

This allows the application to work with real syllabus and question-paper documents rather than requiring users to manually enter large amounts of text.

---

### ⚡ Smart Text Processing & Optimization

One of the main technical challenges of the project was handling large PDF inputs.

Sending an entire syllabus or question paper directly to an AI model could result in:

- Large prompts
- Increased API usage
- Slower responses
- Higher chances of request timeouts

To address this, the backend implements a `smart_truncate()` approach that:

- Detects important syllabus topics
- Prioritizes relevant sections
- Preserves question structures where possible
- Limits the amount of text sent to the AI
- Falls back to simpler truncation strategies when required

The project also configures AI requests for faster processing where appropriate.

This optimization significantly reduces the amount of unnecessary information sent to the AI service.

---

## 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       User          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │                     │
                         │  • Login/Register   │
                         │  • Analyzer         │
                         │  • Generator        │
                         │  • Results          │
                         └──────────┬──────────┘
                                    │
                              HTTP / Axios
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Flask Backend    │
                         │                     │
                         │  • API Endpoints    │
                         │  • Validation       │
                         │  • PDF Processing   │
                         │  • AI Processing    │
                         └──────┬───────┬──────┘
                                │       │
                    ┌───────────┘       └────────────┐
                    ▼                                ▼
           ┌─────────────────┐              ┌─────────────────┐
           │    MongoDB      │              │   PDF / AI      │
           │                 │              │   Processing    │
           │ User Accounts   │              │                 │
           │ Authentication  │              │ PyMuPDF         │
           └─────────────────┘              │ AI APIs         │
                                            └─────────────────┘
