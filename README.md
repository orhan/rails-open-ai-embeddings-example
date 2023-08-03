## Getting Started

To get started with this project, follow these steps:

1. Make sure you have Ruby and Ruby on Rails installed on your machine.

2. Clone this repository to your local machine.

3. Install project dependencies:

   ```bash
   bundle install
   ```
   
Set up the database:

rails db:create
rails db:migrate

(Optional) If you have sample data, you can seed the database:
rails db:seed

Start the Rails server:
rails server

Visit http://localhost:3000 in your web browser to access the application.

Create a new book by filling out the form and clicking "Train AI on my book."

(Note: The AI training process requires a PDF file placed in the training_data folder.)

That's it! You should now have the application running locally with a database set up and ready for AI training on the provided book data.
