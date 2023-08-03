class AiProgressChannel < ApplicationCable::Channel
  def subscribed
    stream_from "ai_progress_channel"
  end
end