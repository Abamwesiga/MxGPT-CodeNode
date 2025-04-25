from django.shortcuts import render
from django.views import View
import requests
from django.http import JsonResponse
from django.conf import settings
from .models import CodeSession, CodeMessage

class MatrixChatView(View):
    def get(self, request):
        return render(request, 'chat/index.html')

    def post(self, request):
        prompt = request.POST.get('prompt', '').strip()
        if not prompt:
            return JsonResponse({'error': 'Prompt cannot be empty'}, status=400)

        # Create a session for the user
        session = CodeSession.objects.create(ip_address=self.get_client_ip(request))
        
        # Get DeepSeek response
        response = self.query_deepseek(prompt)
        
        # Save the message in the database
        CodeMessage.objects.create(
            session=session,
            prompt=prompt,
            response=response,
            language="python"
        )
        
        return JsonResponse({'response': response})

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

    def query_deepseek(self, prompt):
        headers = {
            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-coder-33b-instruct",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        try:
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10  # Set a timeout to avoid hanging requests
            )
            response.raise_for_status()  # Raise an error for HTTP status codes >= 400
            data = response.json()
            return data.get('choices', [{}])[0].get('message', {}).get('content', 'No response from DeepSeek')
        except requests.exceptions.RequestException as e:
            # Log the error for debugging
            print(f"DeepSeek API Error: {e}")
            return "System Error: Unable to connect to DeepSeek API"
        except KeyError:
            return "System Error: Unexpected response format from DeepSeek API"