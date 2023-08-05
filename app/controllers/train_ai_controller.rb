require 'rubygems'
require 'pdf/reader'
require 'dotenv'
require 'ruby/openai'
require 'csv'

class TrainAiController < ApplicationController
    def new
        @book = Book.new
    end

    def create
        @book = Book.first_or_initialize
        @book.assign_attributes(book_params)

        if @book.save
            flash[:success] = "Book was successfully created. AI training is in progress!"
        else
            render json: { error: 'Book could not be created.' }, status: :unprocessable_entity
        end
    end

    def show
        @book = Book.first_or_initialize
    end
      
    def start_training
        @book = Book.first
        
        if @book.present?
            Dotenv.load()
            openai = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
            tokenizer = Tokenizers.from_pretrained("gpt2")
            
            pdf_path = Rails.root.join("training_data", "book.pdf")

            reader = PDF::Reader.new(pdf_path)
            page_count = 0
            
            page_data = [["title", "content", "tokens"]]
            embeddings = []

            reader.pages.each do |page|
                # Create AI embeddings for the current page
                response = openai.embeddings(
                    parameters: {
                        model: "text-search-curie-doc-001",
                        input: page.text
                    }
                )
                
                # Increment the page count
                page_count += 1
                
                # Tokenize the page text and add the embeddings to an array
                content = page.text.to_s.split().join(" ")
                page_data << ["Page " + page_count.to_s, content, tokenizer.encode(content).tokens.length + 4]
                embedding = response['data'][0]['embedding']
                embeddings << {page: "Page " + page_count.to_s, embedding: embedding}

                # Send the progress to the client
                ActionCable.server.broadcast("ai_progress_channel", { page: page_count, total_pages: reader.page_count })
            end
            
            # Save the page data to a CSV file
            CSV.open("book_page_data.csv", "w") do |csv|
                page_data.each do |obj|
                    csv << obj
                end
            end
            
            # Save the embeddings to a CSV file
            CSV.open("book_embeddings.csv", "w") do |csv|
                csv << [:title].concat((0..4095).to_a)
                embeddings.each do |obj|
                    csv << [obj[:page]].concat(obj[:embedding])
                end
            end

            render json: { message: 'AI training completed!' }
        else
            render json: { error: 'No book found for training.' }, status: :not_found
        end
    end
    
    private

    def book_params
        params.require(:book).permit(:title, :author, :cover, :link)
    end
end
