(function($)
{

    bookneticHooks.addAction('booking_panel_loaded', function ( booknetic )
    {
        let booking_panel_js = booknetic.panel_js;

        booking_panel_js.on('click', '.booknetic_service_card', booknetic.throttle(function(e)
        {
            // If view more button is clicked inside services card
            if ( $(e.target).is( ".booknetic_view_more_service_notes_button" ) ) {
                $( this ).find( '.booknetic_service_card_description_wrapped, .booknetic_view_more_service_notes_button' ).css( 'display', 'none' );
                $( this ).find( '.booknetic_service_card_description_fulltext, .booknetic_view_less_service_notes_button' ).css( 'display', 'inline' );
                booknetic.handleScroll();
                return
            } else if ( $(e.target).is( '.booknetic_view_less_service_notes_button' ) ) {
                $( this ).find( '.booknetic_service_card_description_wrapped, .booknetic_view_more_service_notes_button' ).css( 'display', 'inline' );
                $( this ).find( '.booknetic_service_card_description_fulltext, .booknetic_view_less_service_notes_button' ).css( 'display', 'none' );
                booknetic.handleScroll();
                return
            }

            $(this).parents('.bkntc_service_list').find('.booknetic_service_card_selected').removeClass('booknetic_service_card_selected');
            $(this).addClass('booknetic_service_card_selected');

            booknetic.stepManager.goForward();
        }));
    });

    bookneticHooks.addAction('before_step_loading', function( booknetic, new_step_id, old_step_id )
    {
        if( new_step_id !== 'service' )
            return;

        booknetic.stepManager.loadStandartSteps( new_step_id, old_step_id );
    });

    bookneticHooks.addAction('loaded_step', function( booknetic, new_step_id )
    {
        if( new_step_id !== 'service' )
            return;

        let accordion = booknetic.panel_js.find(".bkntc_service_list .booknetic_category_accordion");

        if ( accordion.attr('data-accordion') == 'on' )
        {
            accordion.toggleClass('active');
            accordion.find('>div').not(':first-child').addClass('booknetic_category_accordion_hidden');
            accordion.attr('data-accordion', 'off');
        }

        let searchInput = booknetic.panel_js.find('.booknetic_service_search_input');

        if ( searchInput.length )
        {
            let debounceTimer;

            searchInput.off('input').on('input', function ()
            {
                clearTimeout(debounceTimer);

                debounceTimer = setTimeout(function ()
                {
                    let query = searchInput.val().toLowerCase().trim();
                    let serviceList = booknetic.panel_js.find('.bkntc_service_list');
                    let accordions = serviceList.find('.booknetic_category_accordion');

                    if ( query === '' )
                    {
                        serviceList.find('.booknetic_service_card, .booknetic_service_category').removeAttr('style');
                        accordions.removeAttr('style');

                        accordions.each(function ()
                        {
                            if ( $(this).attr('data-accordion') !== 'on' )
                            {
                                $(this).removeClass('active');
                                let nodes = $(this).find('>div').not(':first-child');
                                nodes.removeClass('booknetic_category_accordion_hidden');
                                nodes.css('display', 'none');
                            }
                        });
                        return;
                    }

                    serviceList.find('.booknetic_category_accordion_hidden').removeClass('booknetic_category_accordion_hidden');
                    accordions.removeAttr('style');
                    serviceList.find('.booknetic_service_card, .booknetic_service_category').removeAttr('style');

                    serviceList.find('.booknetic_service_card').each(function ()
                    {
                        let title = $(this).find('.booknetic_service_title_span').text().toLowerCase();
                        let description = $(this).find('.booknetic_service_card_description_fulltext').text().toLowerCase();

                        if ( title.indexOf(query) !== -1 || description.indexOf(query) !== -1 )
                        {
                            $(this).show();
                        }
                        else
                        {
                            $(this).hide();
                        }
                    });

                    serviceList.find('.booknetic_service_category').each(function ()
                    {
                        let categoryName = $(this).text().toLowerCase();

                        if ( categoryName.indexOf(query) !== -1 )
                        {
                            let nextCards = $(this).nextUntil('.booknetic_service_category, .booknetic_category_accordion').filter('.booknetic_service_card');
                            nextCards.show();
                            $(this).show();
                        }
                        else
                        {
                            let nextCards = $(this).nextUntil('.booknetic_service_category, .booknetic_category_accordion').filter('.booknetic_service_card');
                            let hasVisible = nextCards.filter(':visible').length > 0;
                            $(this).toggle(hasVisible);
                        }
                    });

                    accordions.each(function ()
                    {
                        let hasVisible = $(this).find('.booknetic_service_card:visible').length > 0;
                        $(this).toggle(hasVisible);

                        if ( hasVisible )
                        {
                            $(this).addClass('active');
                        }
                    });
                }, 200);
            });
        }
    });

    bookneticHooks.addFilter('step_validation_service' , function ( result , booknetic )
    {
        if( !( booknetic.getSelected.service() > 0 ) )
        {
            return {
                status: false,
                errorMsg: booknetic.__('select_service')
            };
        }

        return result
    });

})(jQuery);