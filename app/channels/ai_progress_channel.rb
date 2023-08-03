class AiProgressChannel < ApplicationCable::Channel
  def subscribed
    stream_for book
  end

  private

  def book
    Book.first_or_initialize
  end
end