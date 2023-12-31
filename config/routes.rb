Rails.application.routes.draw do
  root 'askmybook#index'
  
  # GET route to show the form for asking a question
  get 'askmybook/start', to: 'askmybook#start', as: 'start'
  
  # POST route to ask a question
  post '/ask_question', to: 'askmybook#ask_question', as: 'ask_question'
  
  # GET route to show the answer
  get '/answer/:id', to: 'askmybook#answer', as: 'answer'
  
  # GET route to show the form for creating a new book
  get '/train_ai/new', to: 'train_ai#new', as: 'new_train_ai'

  # POST route to create the book and trigger AI training
  post '/train_ai', to: 'train_ai#create', as: 'train_ai'

  # POST route to process PDF and generate OpenAI embeddings
  post '/train_ai/start', to: 'train_ai#start_training', as: 'train_ai_start'

  # GET route to show the details of the existing book (if any)
  get '/train_ai', to: 'train_ai#show', as: 'show_train_ai'
  
  # Mount ActionCable server at "/cable"
  mount ActionCable.server => '/cable'
end