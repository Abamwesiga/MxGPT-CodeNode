from django.db import models

class CodeSession(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)

class CodeMessage(models.Model):
    session = models.ForeignKey(CodeSession, on_delete=models.CASCADE)
    prompt = models.TextField()
    response = models.TextField()
    language = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)