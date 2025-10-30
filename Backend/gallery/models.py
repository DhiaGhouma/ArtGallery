from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from PIL import Image
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

class Artwork(models.Model):
    STYLE_CHOICES = [
        ('abstract', 'Abstract'),
        ('realistic', 'Realistic'),
        ('digital', 'Digital Art'),
        ('generative', 'Generative Art'),
        ('photography', 'Photography'),
        ('mixed', 'Mixed Media'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='artworks')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    style = models.CharField(max_length=20, choices=STYLE_CHOICES, default='abstract')
    image = models.ImageField(upload_to='artworks/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    #yosr's add
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    in_stock = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('artwork_detail', kwargs={'pk': self.pk})

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Resize image if it's too large
        if self.image:
            img = Image.open(self.image.path)
            if img.height > 800 or img.width > 800:
                output_size = (800, 800)
                img.thumbnail(output_size)
                img.save(self.image.path)

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'artwork')

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Comment by {self.user.username} on {self.artwork.title}'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
    
class Report(models.Model):
    REPORT_CHOICES = [
        ('inappropriate', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('copyright', 'Copyright Violation'),
        ('other', 'Other'),
    ]

    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reports_made'
    )
    # ⬇️ Passer à SET_NULL pour conserver le Report même si l'objet est supprimé
    artwork = models.ForeignKey(
        Artwork, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports'
    )
    comment = models.ForeignKey(
        Comment, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports'
    )

    reason = models.CharField(max_length=50, choices=REPORT_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    # (optionnel mais utile)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.artwork and getattr(self.artwork, "title", None):
            target = self.artwork.title
        elif self.comment and getattr(self.comment, "user", None):
            target = f'Comment by {self.comment.user.username}'
        else:
            target = 'Deleted content'
        return f'Report by {self.reporter.username} on {target}'

    def mark_resolved(self):
        self.resolved = True
        self.resolved_at = timezone.now()
        self.save(update_fields=['resolved', 'resolved_at'])
    
class Discussion(models.Model):
    """Modèle pour les discussions"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discussions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.IntegerField(default=0)
    replies = models.IntegerField(default=0)
    category = models.CharField(max_length=50, default='General')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Discussion'
        verbose_name_plural = 'Discussions'

    def __str__(self):
        return self.title

    @property
    def timestamp(self):
        """Retourner un timestamp lisible"""
        from django.utils import timezone
        diff = timezone.now() - self.created_at
        
        if diff.days > 365:
            return f"{diff.days // 365} year{'s' if diff.days // 365 > 1 else ''} ago"
        elif diff.days > 30:
            return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hour{'s' if diff.seconds // 3600 > 1 else ''} ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minute{'s' if diff.seconds // 60 > 1 else ''} ago"
        else:
            return "Just now"


class Reply(models.Model):
    """Modèle pour les réponses aux discussions"""
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name='discussion_replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Reply'
        verbose_name_plural = 'Replies'

    def __str__(self):
        return f"Reply by {self.author.username} on {self.discussion.title}"

    @property
    def timestamp(self):
        """Retourner un timestamp lisible"""
        from django.utils import timezone
        diff = timezone.now() - self.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hour{'s' if diff.seconds // 3600 > 1 else ''} ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minute{'s' if diff.seconds // 60 > 1 else ''} ago"
        else:
            return "Just now"