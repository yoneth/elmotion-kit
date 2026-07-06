<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;  // Exit if accessed directly.
}

$config = array (
  'widgets' => 
  array (
    'is_active' => false,
    'elements' => 
    array (
      'general-elements' => 
      array (
        'title' => 'General Widgets',
        'is_active' => false,
        'elements' => 
        array (
          'text-hover-image' => 
          array (
            'label' => 'Text Hover Image',
            'location' => 
            array (
              'cTab' => 'all',
            ),
            'is_active' => false,
            'setup' => 
            array (
              0 => 'basic',
            ),
            'is_pro' => false,
            'is_extension' => false,
            'is_upcoming' => false,
            'icon' => 'eicon-image-rollover',
            'demo_url' => '',
            'doc_url' => '',
            'youtube_url' => '',
            'description' => 'Hover over text and reveal images for an interactive, engaging visual surprise!',
          ),
          'marquee' =>
          array (
            'label' => 'Marquee',
            'location' => 
            array (
              'cTab' => 'all',
            ),
            'is_active' => false,
            'setup' => 
            array (
              0 => 'basic',
            ),
            'is_pro' => false,
            'is_extension' => false,
            'is_upcoming' => false,
            'icon' => 'eicon-carousel',
            'demo_url' => '',
            'doc_url' => '',
            'youtube_url' => '',
            'description' => 'Boost credibility and visibility by highlighting trusted logos with a smooth, auto-scrolling slider.',
          ),
        ),
      ),
      'animation-elements' => 
      array (
        'title' => 'Animations',
        'is_active' => false,
        'elements' => 
        array (
          'animated-title' => 
          array (
            'label' => 'Animated Title',
            'location' => 
            array (
              'cTab' => 'all',
            ),
            'is_active' => false,
            'is_pro' => false,
            'is_extension' => false,
            'is_upcoming' => false,
            'icon' => 'eicon-t-letter',
            'demo_url' => '',
            'doc_url' => '',
            'youtube_url' => '',
            'description' => 'Use this widget to animate titles by character, word, or full text block.',
          ),
          'animated-text' => 
          array (
            'label' => 'Animated Text',
            'location' => 
            array (
              'cTab' => 'all',
            ),
            'is_active' => false,
            'is_pro' => false,
            'is_extension' => false,
            'is_upcoming' => false,
            'icon' => 'eicon-animation-text',
            'demo_url' => '',
            'doc_url' => '',
            'youtube_url' => '',
            'description' => 'Explore text animation styles and transform static text into dynamic, engaging visual content.',
          ),
        ),
      ),
    ),
  ),
  'extensions' => 
  array (
    'is_active' => false,
    'elements' => 
    array (
    ),
  ),
  'integrations' => 
  array (
    'library' => 
    array (
      'title' => 'Library',
      'elements' => 
      array (
        'gsap-library' => 
        array (
          'title' => 'GSAP Library',
          'is_pro' => false,
          'is_active' => false,
          'elements' => 
          array (
            'split-text' => 
            array (
              'label' => 'SplitText',
              'is_pro' => false,
              'is_active' => false,
              'icon' => 'eicon-font',
              'doc_url' => 'https://gsap.com/docs/v3/Plugins/SplitText',
            ),
          ),
        ),
      ),
    ),
  ),
);

$GLOBALS['emk_config'] = $config;
