from .translation_service import translation_service

@csrf_exempt
def translate_text(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            target_language = data.get('target_language', 'en-US')
            
            if not text:
                return JsonResponse({'error': 'No text provided'}, status=400)
            
            # Get translation from the service
            translation_result = translation_service.translate_text(text, target_language)
            
            return JsonResponse({
                'translated_text': translation_result['translated_text'],
                'source_language': translation_result['source_language']
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 