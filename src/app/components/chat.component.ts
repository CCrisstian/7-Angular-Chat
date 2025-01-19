import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Message } from '../models/message';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
})

export class ChatComponent implements OnInit {
  client!: Stomp.Client;
  connected: boolean = false;

  messages: Message[] = [];
  message: Message = new Message();

  ngOnInit(): void {
    this.client = new Stomp.Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/chat-websocket'),
      debug: str => console.log(str),
      reconnectDelay: 5000
    })

    this.client.onConnect = (frame) => {
      this.connected = true;

      console.log(`Conectados: ${this.client.connected} : ${frame}`);

      this.client.subscribe('/chat/message', e => {
        console.log(e.body)
        let message: Message = JSON.parse(e.body) as Message;
        message.date = new Date(message.date);
        if(this.message.username == message.username && !this.message.color && message.type == 'NEW_USER'){
          this.message.color = message.color;
        }
        this.messages.push(message);
      });

      this.message.type = 'NEW_USER';
      
      this.client.publish({
        destination: '/app/message',
        body: JSON.stringify(this.message)
      });
    }

    this.client.onDisconnect = (frame) => {
      this.connected = false;
      this.message = new Message;
      this.messages = [];
      console.log(`Desconectados: ${!this.client.connected} : ${frame}`)
    }

  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  onSendMessage() {
    this.message.type = 'MESSAGE';
    this.client.publish({
      destination: '/app/message',
      body: JSON.stringify(this.message)
    });
    this.message.text='';
  }
}
