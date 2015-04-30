<?php

add_filter( 'typekit_add_font_category_rules', function( $category_rules ) {

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'a,
		abbr,
		acronym,
		address,
		applet,
		big,
		blockquote,
		caption,
		cite,
		code,
		dd,
		del,
		dfn,
		div,
		dl,
		dt,
		em,
		fieldset,
		font,
		form,
		h1,
		h2,
		h3,
		h4,
		h5,
		h6,
		html,
		iframe,
		ins,
		kbd,
		label,
		legend,
		li,
		object,
		ol,
		p,
		pre,
		q,
		s,
		samp,
		small,
		span,
		strike,
		strong,
		sub,
		sup,
		table,
		tbody,
		td,
		tfoot,
		th,
		thead,
		tr,
		tt,
		ul,
		var',
		array(
			array( 'property' => 'font-family', 'value' => 'inherit' ),
			array( 'property' => 'font-size', 'value' => '100%' ),
			array( 'property' => 'font-style', 'value' => 'inherit' ),
			array( 'property' => 'font-weight', 'value' => 'inherit' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'body',
		array(
			array( 'property' => 'font-family', 'value' => 'inherit' ),
			array( 'property' => 'font-size', 'value' => '100%' ),
			array( 'property' => 'font-style', 'value' => 'inherit' ),
			array( 'property' => 'font-weight', 'value' => 'inherit' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'body,
		input,
		select,
		textarea',
		array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h1,
		h2:not(.site-description),
		h3,
		h4,
		h5,
		h6',
		array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h1',
		array(
			array( 'property' => 'font-size', 'value' => '26px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h2:not(.site-description)',
		array(
			array( 'property' => 'font-size', 'value' => '24px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h3',
		array(
			array( 'property' => 'font-size', 'value' => '22px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h4',
		array(
			array( 'property' => 'font-size', 'value' => '20px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h5',
		array(
			array( 'property' => 'font-size', 'value' => '18px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'h6',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'address',
		array(
			array( 'property' => 'font-style', 'value' => 'italic' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'b,
		strong',
		array(
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'dfn,
		em,
		i',
		array(
			array( 'property' => 'font-style', 'value' => 'italic' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'code,
		kbd,
		pre,
		samp,
		tt,
		var',
		array(
			array( 'property' => 'font-family', 'value' => 'monospace, serif' ),
			array( 'property' => 'font-size', 'value' => '15px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'blockquote',
		array(
			array( 'property' => 'font-size', 'value' => '19px' ),
			array( 'property' => 'font-style', 'value' => 'italic' ),
			array( 'property' => 'font-weight', 'value' => '300' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'blockquote cite,
		blockquote small',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'blockquote cite,
		blockquote em,
		blockquote i',
		array(
			array( 'property' => 'font-style', 'value' => 'normal' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'blockquote b,
		blockquote strong',
		array(
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'small',
		array(
			array( 'property' => 'font-size', 'value' => 'smaller' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'big',
		array(
			array( 'property' => 'font-size', 'value' => '125%' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'sub,
		sup',
		array(
			array( 'property' => 'font-size', 'value' => '75%' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'dt',
		array(
			array( 'property' => 'font-weight', 'value' => 'bold' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'button,
		input,
		select,
		textarea',
		array(
			array( 'property' => 'font-size', 'value' => '100%' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'caption,
		td,
		th',
		array(
			array( 'property' => 'font-weight', 'value' => 'normal' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'th',
		array(
			array( 'property' => 'font-weight', 'value' => 'bold' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.contributor-posts-link,
		button,
		input[type="button"],
		input[type="reset"],
		input[type="submit"]',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.wp-caption-text',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-style', 'value' => 'italic' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.screen-reader-text:focus',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
			array( 'property' => 'font-weight', 'value' => 'bold' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.bypostauthor > article .fn:before,
		.comment-edit-link:before,
		.comment-reply-link:before,
		.comment-reply-login:before,
		.comment-reply-title small a:before,
		.contributor-posts-link:before,
		.menu-toggle:before,
		.search-toggle:before,
		.slider-direction-nav a:before,
		.widget_twentyfourteen_ephemera .widget-title:before',
		array(
			array( 'property' => 'font', 'value' => 'normal 16px/1 Genericons' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'site-title',
		'.site-title',
		array(
			array( 'property' => 'font-family', 'value' => 'lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '18px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.search-toggle:before',
		array(
			array( 'property' => 'font-size', 'value' => '20px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.search-box .search-field',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.primary-navigation',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.secondary-navigation',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.menu-toggle',
		array(
			array( 'property' => 'font-size', 'value' => '0' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'headings',
		'.entry-title',
		array(
			array( 'property' => 'font-size', 'value' => '33px' ),
			array( 'property' => 'font-weight', 'value' => '300' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.entry-meta',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.cat-links',
		array(
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.tag-links a',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-content table,
		.entry-content table',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-content th,
		.entry-content th',
		array(
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.entry-content .edit-link',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'#page .entry-content div.sharedaddy h3, #page .entry-summary div.sharedaddy h3, #page .entry-content h3.sd-title, #page .entry-summary h3.sd-title, #primary div.sharedaddy .jp-relatedposts-headline em, .pd-rating',
		array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '11px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.page-links',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.more-link,
		.post-format-archive-link',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.gallery-caption',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.post-navigation .meta-nav',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.image-navigation a,
		.post-navigation a',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.paging-navigation .page-numbers',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.archive-title,
		.page-title',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.taxonomy-description',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.contributor-name',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-reply-title,
		.comments-title',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-author',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-list .reply,
		.comment-metadata',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-author .fn',
		array(
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.no-comments',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.form-allowed-tags,
		.form-allowed-tags code',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-reply-title small a:before',
		array(
			array( 'property' => 'font-size', 'value' => '32px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.comment-navigation',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.site-description',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h1',
		array(
			array( 'property' => 'font-size', 'value' => '22px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h2',
		array(
			array( 'property' => 'font-size', 'value' => '20px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h3',
		array(
			array( 'property' => 'font-size', 'value' => '18px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h4',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h5',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget h6',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget code,
		.widget kbd,
		.widget pre,
		.widget samp,
		.widget tt,
		.widget var',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget blockquote',
		array(
			array( 'property' => 'font-size', 'value' => '18px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget blockquote cite',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'.widget input,
		.widget textarea',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'.widget button,
		.widget input[type="button"],
		.widget input[type="reset"],
		.widget input[type="submit"]',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget .widget-title',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget_calendar caption',
		array(
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget_twentyfourteen_ephemera .entry-content table,
		.widget_twentyfourteen_ephemera .entry-meta,
		.widget_twentyfourteen_ephemera .entry-title,
		.widget_twentyfourteen_ephemera .more-link,
		.widget_twentyfourteen_ephemera .post-format-archive-link,
		.widget_twentyfourteen_ephemera .wp-caption-text',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget_twentyfourteen_ephemera .entry-title',
		array(
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.widget_twentyfourteen_ephemera .post-format-archive-link',
		array(
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.content-sidebar .widget .widget-title',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.content-sidebar .widget_calendar caption',
		array(
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.content-sidebar.widget_twentyfourteen_ephemera blockquote cite',
		array(
			array( 'property' => 'font-size', 'value' => '13px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.content-sidebar .widget_twentyfourteen_ephemera .post-format-archive-link',
		array(
			array( 'property' => 'font-weight', 'value' => '900' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.site-footer',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.featured-content .entry-meta',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.featured-content .cat-links',
		array(
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.featured-content .entry-title',
		array(
			array( 'property' => 'font-size', 'value' => '18px' ),
			array( 'property' => 'font-weight', 'value' => '300' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.slider-direction-nav a',
		array(
			array( 'property' => 'font-size', 'value' => '0' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.slider-direction-nav a:before',
		array(
			array( 'property' => 'font-size', 'value' => '32px' ),
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.list-view .site-content .entry-title',
		array(
			array( 'property' => 'font-size', 'value' => '15px' ),
			array( 'property' => 'font-weight', 'value' => '900' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.attachment span.entry-date:before,
		.entry-content .edit-link a:before,
		.entry-meta .edit-link a:before,
		.site-content .byline a:before,
		.site-content .comments-link a:before,
		.site-content .entry-date a:before,
		.site-content .featured-post:before,
		.site-content .full-size-link a:before,
		.site-content .parent-post-link a:before,
		.site-content .post-format a:before',
		array(
			array( 'property' => 'font', 'value' => 'normal 16px/1 Genericons' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.slider .featured-content .entry-title',
		array(
			array( 'property' => 'font-size', 'value' => '22px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.primary-navigation',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget,
		.primary-sidebar .widget',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h1,
		.primary-sidebar .widget h1',
		array(
			array( 'property' => 'font-size', 'value' => '20px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h2,
		.primary-sidebar .widget h2',
		array(
			array( 'property' => 'font-size', 'value' => '18px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h3,
		.primary-sidebar .widget h3',
		array(
			array( 'property' => 'font-size', 'value' => '16px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h4,
		.primary-sidebar .widget h4',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h5,
		.primary-sidebar .widget h5',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget h6,
		.primary-sidebar .widget h6',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget code,
		.footer-sidebar .widget kbd,
		.footer-sidebar .widget pre,
		.footer-sidebar .widget samp,
		.footer-sidebar .widget tt,
		.footer-sidebar .widget var,
		.primary-sidebar .widget code,
		.primary-sidebar .widget kbd,
		.primary-sidebar .widget pre,
		.primary-sidebar .widget samp,
		.primary-sidebar .widget tt,
		.primary-sidebar .widget var',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget blockquote,
		.primary-sidebar .widget blockquote',
		array(
			array( 'property' => 'font-size', 'value' => '14px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget blockquote cite,
		.primary-sidebar .widget blockquote cite',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'body-text',
		'.footer-sidebar .widget input,
		.footer-sidebar .widget textarea,
		.primary-sidebar .widget input,
		.primary-sidebar .widget textarea',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget .widget-title,
		.primary-sidebar .widget .widget-title',
		array(
			array( 'property' => 'font-size', 'value' => '11px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget_twentyfourteen_ephemera .entry-content table,
		.footer-sidebar .widget_twentyfourteen_ephemera .entry-meta,
		.footer-sidebar .widget_twentyfourteen_ephemera .entry-title,
		.footer-sidebar .widget_twentyfourteen_ephemera .wp-caption-text,
		.primary-sidebar .widget_twentyfourteen_ephemera .entry-content table,
		.primary-sidebar .widget_twentyfourteen_ephemera .entry-meta,
		.primary-sidebar .widget_twentyfourteen_ephemera .entry-title,
		.primary-sidebar .widget_twentyfourteen_ephemera .wp-caption-text',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar .widget_twentyfourteen_ephemera .more-link,
		.footer-sidebar .widget_twentyfourteen_ephemera .post-format-archive-link,
		.primary-sidebar .widget_twentyfourteen_ephemera .more-link,
		.primary-sidebar .widget_twentyfourteen_ephemera .post-format-archive-link',
		array(
			array( 'property' => 'font-size', 'value' => '10px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.footer-sidebar',
		array(
			array( 'property' => 'font-size', 'value' => '12px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	TypekitTheme::add_font_category_rule( $category_rules, 'none',
		'.slider .featured-content .entry-title',
		array(
			array( 'property' => 'font-size', 'value' => '33px' ),
		),
		array(
			'screen and (max-width: 400px)',
		)
	);

	return $category_rules;
} );
