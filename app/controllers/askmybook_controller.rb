require 'rubygems'
require 'dotenv'
require 'ruby/openai'
require 'csv'
require 'cosine_similarity'

MAX_TOKENS_LENGTH = 500
SEPARATOR = "\n* "
SEPARATOR_LENGTH = 3

class AskmybookController < ApplicationController
    def index
        @book = Book.first
    end
    
    def ask_question
        @book = Book.first
        @question = Question.find_by question: params[:question]
        
        if @question.present?
            render json: { redirect: '/answer/' + @question.id.to_s }, status: :ok
            return
        else
            @question = Question.new()
            @question.question = params[:question]
            
            Dotenv.load()
            openai = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
            tokenizer = Tokenizers.from_pretrained("gpt2")
            
            # Get an embedding for the question
            question_embedding_response = openai.embeddings(
                parameters: {
                    model: "text-search-curie-doc-001",
                    input: @question.question
                }
            )
            
            question_embedding = question_embedding_response['data'][0]['embedding']
            similarity_array = []
            page_embeddings = {}
            
            # Load the embeddings as an object with page number as key and its embeddings as an array
            CSV.foreach("book_embeddings.csv", headers: false, col_sep: ",") do |row|
                values = row.to_a
                
                if values[0] != "title"
                    page = values[0]
                    values.shift
                    
                    page_embeddings[page] = values.map do |value| 
                        value.to_f
                    end
                end
            end
            
            page_embeddings.each do |page, embedding|
                similarity_array << [page, cosine_similarity(question_embedding, embedding)]
            end
            
            similarity_array_sorted = similarity_array.sort_by { |page, similarity| similarity }.reverse
            csv = CSV.read('book_page_data.csv', headers: true)
            
            chosen_sections = []
            total_section_length = 0
            
            similarity_array_sorted.each do |page, similarity|
                section = csv.find {|row| row['title'] == page}
                
                if total_section_length + section['tokens'].to_i + SEPARATOR_LENGTH > MAX_TOKENS_LENGTH
                    left_token_count = MAX_TOKENS_LENGTH - total_section_length
                    truncated_content = tokenizer.decode(tokenizer.encode(SEPARATOR + section['content']).ids[0..left_token_count])
                    chosen_sections << truncated_content
                    break
                end
                
                total_section_length += section['tokens'].to_i + SEPARATOR_LENGTH
                chosen_sections << section['content']
            end
            
            header = "Sahil Lavingia is the founder and CEO of Gumroad, and the author of the book The Minimalist Entrepreneur (also known as TME). These are questions and answers by him. Please keep your answers to three sentences maximum, and speak in complete sentences. Stop speaking once your point is made.\n\nContext that may be useful, pulled from The Minimalist Entrepreneur:\n"

            question_1 = "\n\n\nQ: How to choose what business to start?\n\nA: First off don't be in a rush. Look around you, see what problems you or other people are facing, and solve one of these problems if you see some overlap with your passions or skills. Or, even if you don't see an overlap, imagine how you would solve that problem anyway. Start super, super small."
            question_2 = "\n\n\nQ: Q: Should we start the business on the side first or should we put full effort right from the start?\n\nA:   Always on the side. Things start small and get bigger from there, and I don't know if I would ever “fully” commit to something unless I had some semblance of customer traction. Like with this product I'm working on now!"
            question_3 = "\n\n\nQ: Should we sell first than build or the other way around?\n\nA: I would recommend building first. Building will teach you a lot, and too many people use “sales” as an excuse to never learn essential skills like building. You can't sell a house you can't build!"
            question_4 = "\n\n\nQ: Andrew Chen has a book on this so maybe touché, but how should founders think about the cold start problem? Businesses are hard to start, and even harder to sustain but the latter is somewhat defined and structured, whereas the former is the vast unknown. Not sure if it's worthy, but this is something I have personally struggled with\n\nA: Hey, this is about my book, not his! I would solve the problem from a single player perspective first. For example, Gumroad is useful to a creator looking to sell something even if no one is currently using the platform. Usage helps, but it's not necessary."
            question_5 = "\n\n\nQ: What is one business that you think is ripe for a minimalist Entrepreneur innovation that isn't currently being pursued by your community?\n\nA: I would move to a place outside of a big city and watch how broken, slow, and non-automated most things are. And of course the big categories like housing, transportation, toys, healthcare, supply chain, food, and more, are constantly being upturned. Go to an industry conference and it's all they talk about! Any industry…"
            question_6 = "\n\n\nQ: How can you tell if your pricing is right? If you are leaving money on the table\n\nA: I would work backwards from the kind of success you want, how many customers you think you can reasonably get to within a few years, and then reverse engineer how much it should be priced to make that work."
            question_7 = "\n\n\nQ: Why is the name of your book 'the minimalist entrepreneur' \n\nA: I think more people should start businesses, and was hoping that making it feel more “minimal” would make it feel more achievable and lead more people to starting-the hardest step."
            question_8 = "\n\n\nQ: How long it takes to write TME\n\nA: About 500 hours over the course of a year or two, including book proposal and outline."
            question_9 = "\n\n\nQ: What is the best way to distribute surveys to test my product idea\n\nA: I use Google Forms and my email list / Twitter account. Works great and is 100% free."
            question_10 = "\n\n\nQ: How do you know, when to quit\n\nA: When I'm bored, no longer learning, not earning enough, getting physically unhealthy, etc… loads of reasons. I think the default should be to “quit” and work on something new. Few things are worth holding your attention for a long period of time."

            context = chosen_sections.join
            prompt = header + context + question_1 + question_2 + question_3 + question_4 + question_5 + question_6 + question_7 + question_8 + question_9 + question_10 + "\n\n\nQ: " + @question.question + "\n\nA: "
            
            puts "===\n" + prompt
            response = openai.completions(
                parameters: {
                    prompt: prompt,
                    temperature: 0.0,
                    max_tokens: 150,
                    model: "text-davinci-003",
                }
            )
            
            puts "===\n" + response.to_s
            answer = response['choices'][0]['text'].lstrip
            puts "===\n" + answer
            @question.answer = answer
            
            if @question.save
                render json: {status: 'SUCCESS', message: 'Saved answer', data: @question, url: '/answer/' + @question.id.to_s}, status: :ok
            else
                render json: {status: 'ERROR', message: 'Answer not saved', data: @question.errors}, status: :unprocessable_entity
            end
        end
    end
    
    def answer
        @book = Book.first
        @answer = Question.find(params[:id])
    end
end
