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

            reader.pages.each do |page|
                # Perform AI embeddings for the current page
                # TODO Replace with embedding code
                sleep(1)

                # Increment the page count
                page_count += 1

                # Send the progress to the client
                ActionCable.server.broadcast("ai_progress", page: page_count, total_pages: reader.page_count)
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
    
    # def load_my_book
    #     path = Rails.root.join('app', 'assets', 'book.pdf')
    #     reader = PDF::Reader.new(path)
    #     @pdf_text = ""
        
    #     reader.pages.each do |page|
    #         text_array << page.text
    #     end
        
    #     text_array.each_with_index do |text, index|
    #         # response = openai.embeddings(
    #         #     parameters: {
    #         #     model: "text-search-curie-doc-001",
    #         #     input: text
    #         #     }
    #         # )
            
    #         # embedding = response['data'][0]['embedding']
            
    #         # embedding_hash = {embedding: embedding, text: text}
    #         # embedding_array << embedding_hash
            
    #         sleep(2)
            
    #         broadcast_replace_to(
    #             "progress",
    #             target: "progress",
    #             html: <<~HTML
    #                 <p id="progress">Training page #{index + 1} of #{text_array.length}</p>
    #           HTML
    #           )
    #     end
          
    #     CSV.open("embeddings.csv", "w") do |csv|
    #         csv << [:embedding, :text]
    #         embedding_array.each do |obj|
    #             csv << [obj[:embedding], obj[:text]]
    #         end
    #     end
    # end
end
