require 'rubygems'
require 'pdf/reader'

class AskmybookController < ApplicationController
    def index
        @welcome = "Welcome to AskMyBook!"
    end
end
