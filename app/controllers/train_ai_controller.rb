require 'rubygems'
require 'pdf/reader'
require 'dotenv'
require 'ruby/openai'
require 'csv'

Dotenv.load()
openai = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])

class TrainAiController < ApplicationController
    def new
        @book = Book.new
    end

    def create
        @book = Book.first_or_initialize
        @book.assign_attributes(book_params)

        if @book.save
            flash[:success] = "Book was successfully created. AI training is in progress!"
            redirect_to url_for(controller: 'train_ai', action: 'show', id: @book)
        else
            render 'new'
        end
    end

    def show
        @book = Book.first_or_initialize
    end
      
    def start_training
        @book = Book.first
        
        if @book.present?
            pdf_path = Rails.root.join("training_data", "book.pdf")

            reader = PDF::Reader.new(pdf_path)
            page_count = 0
            
            embeddings = []

            reader.pages.each do |page|
                # Perform AI embeddings for the current page
                response = openai.embeddings(
                    parameters: {
                        model: "text-search-curie-doc-001",
                        input: text
                    }
                )
                
                # Increment the page count
                page_count += 1
                
                # sleep(1)
                # embedding = [123, 456, 789, 111, 222]
                embedding = response['data'][0]['embedding']
                embeddings << {page: "Page " + page_count.to_s, embedding: embedding}
                

                # Send the progress to the client
                ActionCable.server.broadcast("ai_progress_channel", { page: page_count, total_pages: reader.page_count })
            end
            
            CSV.open("embeddings.csv", "w") do |csv|
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
