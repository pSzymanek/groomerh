(function($)
{

    bookneticHooks.addAction('booking_panel_loaded', function ( booknetic )
    {
        let booking_panel_js = booknetic.panel_js;

        booking_panel_js.on('click', '.booknetic_card', function()
        {
            $(this).closest('.booknetic_card_container').find('.booknetic_card_selected').removeClass('booknetic_card_selected');
            $(this).addClass('booknetic_card_selected');

            booknetic.stepManager.goForward();
        });
    });

    bookneticHooks.addAction('before_step_loading', function( booknetic, new_step_id, old_step_id )
    {
        if( new_step_id !== 'location' )
            return;

        booknetic.stepManager.loadStandartSteps( new_step_id, old_step_id );
    });

    bookneticHooks.addAction('loaded_step', function( booknetic, new_step_id )
    {
        if( new_step_id !== 'location' )
            return;

        booknetic.panel_js.find(".booknetic_card_container .booknetic_category_accordion[data-accordion='on']").each(function() {
            $(this).find('>div').not(':first-child').addClass('booknetic_category_accordion_hidden');
            $(this).attr('data-accordion', 'off');
        });
    });

    bookneticHooks.addFilter('step_validation_location' , function ( result , booknetic )
    {
        if( !( booknetic.getSelected.location() > 0 ) )
        {
            return {
                status: false,
                errorMsg: booknetic.__('select_location')
            };
        }

        return result
    });

})(jQuery);
