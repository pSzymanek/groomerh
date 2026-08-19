(function($)
{
    "use strict";

    $(document).ready(function()
    {

        bookneticHooks.addFilter('ajax_confirm' , function (params,booknetic)
        {
           if( booknetic.customFiles !== undefined )
           {
               for (let i = 0; i < booknetic.customFiles.length ; i++) {
                   params.append('custom_files[' + booknetic.customFiles[i].id + ']' , booknetic.customFiles[i].file);
               }
           }
           return params;
        });

        bookneticHooks.addAction( 'loaded_step_information', function( booknetic )
        {
            var booking_panel_js = booknetic.panel_js;

            booking_panel_js.find(".booknetic_custom_form .custom-forms-date-input").each(function()
            {
                $(this).attr('type', 'text').data('isdatepicker', true);

                booknetic.initDatepicker( $(this) );
            });

            booking_panel_js.find(".booknetic_custom_form .custom-input-select2").select2({
                theme: 'bootstrap',
                allowClear: true
            });

            booking_panel_js.on('click', '.booknetic_custom_form .remove_custom_file_btn', function()
            {
                var placeholder = $(this).data('placeholder');

                $(this).parent().text( placeholder );
            });

            booking_panel_js.on('change', '[data-step-id=\'information\'] .booknetic_custom_form .form-control[type="file"]', function (e)
            {
                if( ! e.target.files || ! e.target.files[0] )
                {
                    return;
                }

                var fileName = e.target.files[0].name;
                $(this).next().text( fileName );

            }).on('change', '[data-step-id=\'information\'] .booknetic_custom_form input, [data-step-id=\'information\'] .booknetic_custom_form select, [data-step-id=\'information\']  .booknetic_custom_form textarea', function ()
            {
                if( $(this).attr('type') === 'checkbox' || $(this).attr('type') === 'radio' )
                {
                    $(this).parent().parent().find('.booknetic_input_error').removeClass('booknetic_input_error');
                }
                else if( $(this).attr('type') === 'file' )
                {
                    $(this).next().removeClass('booknetic_input_error');
                }
                else if( $(this).is('select') )
                {
                    $(this).next().find('.booknetic_input_error').removeClass('booknetic_input_error');
                }
                else
                {
                    $(this).removeClass('booknetic_input_error');
                }
            });

            bookneticInitFormConditions( booknetic, booking_panel_js, false );
        });

        bookneticHooks.addAction('step_end_information' , function (booknetic)
        {
            var customFields = {};
            var booking_panel_js  = booknetic.panel_js;
            var index = booknetic.cartCurrentIndex;
            var cart = booknetic.cartArr;
            var params = cart[index];
            var form = booking_panel_js.find(".booknetic_appointment_container_body [data-step-id=\"information\"]");

            form.find(".booknetic_custom_form [data-input-id][type!='checkbox'][type!='radio'], .booknetic_custom_form [data-input-id][type='checkbox']:checked, .booknetic_custom_form [data-input-id][type='radio']:checked").each(function()
            {
                var inputId		= $(this).data('input-id'),
                    inputVal	= $(this).val();

                if( !inputVal )
                {
                    inputVal = '';
                }

                if( inputVal != '' && $(this).data('isdatepicker') )
                {
                    inputVal = inputVal.replace(/\s+/g, '')
                    inputVal = booknetic.convertDate( inputVal, booknetic.datePickerFormat(), 'Y-m-d' );
                }

                if( $(this).attr('type') == 'file' )
                {
                    if( $(this)[0].files[0] )
                    {
                        var uniqueId = Math.random().toString(36).substring(2, 9);
                        if( booknetic.customFiles === undefined)
                        {
                            booknetic.customFiles = [];
                        }
                        booknetic.customFiles.push({
                            id : uniqueId,
                            file : $(this)[0].files[0]
                        })
                        customFields[ inputId ] = {
                            id: uniqueId,
                            name: $(this)[0].files[0].name
                        } ;
                    }
                }
                else
                {
                    if( typeof customFields[ inputId ] == 'undefined' )
                    {
                        customFields[ inputId ] = inputVal;
                    }
                    else
                    {
                        customFields[ inputId ] += ',' + inputVal;
                    }
                }
            });

            params['custom_fields'] = customFields;
        });

        bookneticHooks.addFilter('step_validation_information' , function ( params , booknetic )
        {
            let status = params.status;
            let errorMsg = params.errorMsg;
            let hasError = false;

            booknetic.panel_js.find(".booknetic_appointment_container_body [data-step-id='information'] > .booknetic_custom_form label").each(function()
            {
                let el = $(this).next();
                let validationStatus = bookneticCustomFieldValidation.validateInput(el, 'booknetic_input_error', booknetic);

                if( validationStatus !== true )
                    hasError = validationStatus;
            });

            if( hasError )
            {
                status      = false;
                errorMsg    = hasError;
            }

            return {
                status: status,
                errorMsg: errorMsg
            };
        });
    });

})(jQuery);