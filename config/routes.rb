Rails.application.routes.draw do
  # GET route to show the form for creating a new book
  get '/train_ai/new', to: 'train_ai#new', as: 'new_train_ai'

  # POST route to create the book and trigger AI training
  post '/train_ai', to: 'train_ai#create', as: 'train_ai'

  # POST route to process PDF and generate OpenAI embeddings
  post '/train_ai/start', to: 'train_ai#start_training', as: 'train_ai_start'

  # GET route to show the details of the existing book (if any)
  get '/train_ai', to: 'train_ai#show', as: 'show_train_ai'
end