let activeCustomerCheckingRequestsCount = 0;
(function($)
{

    let customerIdentifierInputListener = null;

    const checkIfCustomerExist = function ( booknetic )
    {
        let booking_panel_js = booknetic.panel_js;
        booking_panel_js.find('.bkntc_input_identifier_loading').show();
        activeCustomerCheckingRequestsCount++;

        let saveIdentifierInputValueBeforeAjax = booking_panel_js.find('.bkntc_input_identifier_input').val();

        booknetic.ajax('check_customer_exist', booknetic.ajaxParameters(), function( result )
        {
            activeCustomerCheckingRequestsCount--;

            if( ! activeCustomerCheckingRequestsCount )
                booking_panel_js.find('.bkntc_input_identifier_loading').hide();

            let customerIdAlreadySet = booking_panel_js.find('.bkntc_input_identifier_input').data('customer-id');

            if( ! customerIdAlreadySet )
            {
                if( result.customer_id )
                {
                    booking_panel_js.find('[data-bkntc-customer-info="true"]').hide();

                    booking_panel_js.find('.bkntc_input_identifier_input').closest('[data-bkntc-customer-info="true"]').show();
                    booking_panel_js.find('.bkntc_input_identifier_input').attr('disabled', true);
                    booking_panel_js.find('.bkntc_input_identifier_input').data('customer-id', result.customer_id);
                    booking_panel_js.find('.bkntc_input_identifier_clear').show();
                    booking_panel_js.find('.bkntc_input_identifier_input').val( saveIdentifierInputValueBeforeAjax );

                    booking_panel_js.find('[data-bkntc-customer-id="true"]').show();
                }
                else
                {
                    booking_panel_js.find('[data-bkntc-customer-info="true"]:not(.bkntc_hidden_lastname)').show();
                    booking_panel_js.find('[data-bkntc-customer-id="true"]').hide();
                    booking_panel_js.find('.bkntc_input_identifier_input').attr('disabled', false);
                    booking_panel_js.find('.bkntc_input_identifier_input').data('customer-id', '');
                }
            }

        }, false, function()
        {
            activeCustomerCheckingRequestsCount--;

            if( ! activeCustomerCheckingRequestsCount )
                booking_panel_js.find('.bkntc_input_identifier_loading').hide();
        });
    }

    bookneticHooks.addAction('booking_panel_loaded', function ( booknetic )
    {
        let booking_panel_js = booknetic.panel_js;
        let identifierInput = booking_panel_js.find('.bkntc_input_identifier_clear').parent().find('input');

        booking_panel_js.on('keyup change', '#bkntc_input_name, #bkntc_input_surname, #bkntc_input_email, #bkntc_input_email_confirm, #bkntc_input_phone', function ()
        {
            $(this).removeClass('booknetic_input_error');
        }).on('click', '.booknetic_social_login_facebook, .booknetic_social_login_google', function ()
        {
            let login_window = window.open($(this).data('href'), 'booknetic_social_login', 'width=1000,height=700');

            let while_fn = function ()
            {
                var dataType = 'undefined';

                try {
                    dataType = typeof login_window.booknetic_user_data;
                }
                catch (err){}

                if( dataType != 'undefined' )
                {
                    if( booking_panel_js.find('#bkntc_input_surname').parent('div').hasClass('booknetic_hidden') )
                    {
                        booking_panel_js.find('#bkntc_input_name').val( login_window.booknetic_user_data['first_name'] + ' ' + login_window.booknetic_user_data['last_name'] );
                    }
                    else
                    {
                        booking_panel_js.find('#bkntc_input_name').val( login_window.booknetic_user_data['first_name'] );
                        booking_panel_js.find('#bkntc_input_surname').val( login_window.booknetic_user_data['last_name'] );
                    }

                    booking_panel_js.find('#bkntc_input_email').val( login_window.booknetic_user_data['email'] );
                    let confirmEmailInput = booking_panel_js.find('#bkntc_input_email_confirm');
                    if( confirmEmailInput.length )
                    {
                        confirmEmailInput.val( login_window.booknetic_user_data['email'] );
                    }
                    login_window.close();
                    return;
                }

                if( !login_window.closed )
                {
                    setTimeout( while_fn, 1000 );
                }
            }

            while_fn();
        }).on('focusout blur keyup keypress change input', '.bkntc_input_identifier_input', function ( event )
        {
            let isFocusOutEvent = (event.type == 'blur' || event.type == 'focusout');

            if( $(this).data('last_val') === $(this).val() )
                return;

            $(this).data('last_val', $(this).val());

            if( customerIdentifierInputListener !== null )
            {
                clearTimeout( customerIdentifierInputListener );
                customerIdentifierInputListener = null
            }

            if( $(this).val() != '' )
            {
                customerIdentifierInputListener = setTimeout( function ()
                {
                    checkIfCustomerExist( booknetic );
                }, isFocusOutEvent ? 100 : 500 );
            }
        }).on('click', '.bkntc_input_identifier_clear', function ()
        {
            $(this).hide();

            booking_panel_js.find('[data-bkntc-customer-info="true"]:not(.bkntc_hidden_lastname)').show();
            booking_panel_js.find('[data-bkntc-customer-id="true"]').hide();
            booking_panel_js.find('.bkntc_input_identifier_input').attr('disabled', false);
            booking_panel_js.find('.bkntc_input_identifier_input').data('customer-id', '');

            booking_panel_js.find('.bkntc_input_identifier_input').data('last_val', '');

            booking_panel_js.find('#bkntc_input_email').val("");
            booking_panel_js.find('#bkntc_input_email').prop('disabled', false);
            booking_panel_js.find('#bkntc_input_email_confirm').val("");
            booking_panel_js.find('#bkntc_input_email_confirm').prop('disabled', false);

            booking_panel_js.find('#bkntc_input_phone').val("");
            booking_panel_js.find('#bkntc_input_phone').prop('disabled', false);

            booking_panel_js.find('#bkntc_input_name').val("");
            booking_panel_js.find('#bkntc_input_name').prop('disabled', false);

            booking_panel_js.find('#bkntc_input_surname').val("");
            booking_panel_js.find('#bkntc_input_surname').prop('disabled', false);


        });
    });

    bookneticHooks.addFilter('step_validation_information' , function ( result , booknetic )
    {
        let booking_panel_js = booknetic.panel_js;
        var hasError = false;

        booking_panel_js.find( 'label[for="bkntc_input_name"], label[for="bkntc_input_surname"], label[for="bkntc_input_email"], label[for="bkntc_input_phone"]' ).each( function ()
        {
            var el = $( this ).next();
            var required = $( this ).is( '[data-required="true"]' );

            // doit bunu axi hechvaxt yoxlamayacag?
            if ( el.is( '.booknetic_number_of_brought_customers_quantity' ) )
            {
                el = el.find( 'input' );
                if ( el.data( 'max-quantity' ) < el.val() )
                {
                    if( booking_panel_js.find("#booknetic_bring_someone_checkbox").is(":checked") )
                    {
                        el.addClass( 'booknetic_input_error' );
                        hasError =  booknetic.__( 'You have exceed the maximum value for number of people' );
                    }
                }
            }
            if( el.is('.bkntc_input_phone-container') )
            {
                el = el.find('#bkntc_input_phone');
            }

            if( ! ( booknetic.getSelected.customerId() > 0 ) )
            {
                if( el.is('#bkntc_input_name , #bkntc_input_surname , #bkntc_input_email, #bkntc_input_phone') )
                {
                    var value = el.val();

                    if( required && (value.trim() == '' || value == null) )
                    {
                        if( el.is('select') )
                        {
                            el.next().find('.select2-selection').addClass('booknetic_input_error');
                        }
                        else if( el.is('input[type="file"]') )
                        {
                            el.next().addClass('booknetic_input_error');
                        }
                        else
                        {
                            el.addClass('booknetic_input_error');
                        }
                        hasError = booknetic.__('fill_all_required');
                    }
                    else if( el.attr('name') === 'email' )
                    {
                        var email_regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        var checkEmail = email_regexp.test(String(value.trim()).toLowerCase());

                        if( !( (value == '' && !required) || checkEmail ) )
                        {
                            el.addClass('booknetic_input_error');
                            hasError = booknetic.__('email_is_not_valid');
                        }
                    }
                    else if (el.attr('name') === 'phone') {
                        const itiInstance = booking_panel_js.find('#bkntc_input_phone').data('iti');
                        const phoneValue = el.val().trim();
                        const isEmpty = phoneValue === '';
                        const needsValidation = required || !isEmpty;

                        if (needsValidation && !isEmpty) {
                            const utilsReady = !!(window.bookneticIntlTelInput && window.bookneticIntlTelInput.utils);
                            let isValid;

                            if (itiInstance && utilsReady) {
                                isValid = itiInstance.isValidNumber();
                            } else {
                                const phoneRegex = /^\+?(\d{1,3})?[-. \(\)]?\d{1,4}[-. \(\)]?\d{1,4}[-. \(\)]?\d{1,9}$/;
                                isValid = phoneValue.length >= 6 && phoneValue.length <= 20 && phoneRegex.test(phoneValue);
                            }

                            if (!isValid) {
                                el.addClass('booknetic_input_error');
                                hasError = booknetic.__('phone_is_not_valid');
                            }
                        }
                    }
                }
            }
        });

        if( hasError === false && BookneticData.require_email_confirmation )
        {
            let emailInput = booking_panel_js.find('#bkntc_input_email');
            let confirmEmailInput = booking_panel_js.find('#bkntc_input_email_confirm');
            let confirmVisible = confirmEmailInput.length && confirmEmailInput.is(':visible') && !confirmEmailInput.prop('disabled');

            if( confirmVisible )
            {
                let emailValue = ( emailInput.val() || '' ).trim();
                let confirmValue = ( confirmEmailInput.val() || '' ).trim();

                if( emailValue !== '' || confirmValue !== '' )
                {
                    if( emailValue === '' || confirmValue === '' )
                    {
                        emailInput.addClass('booknetic_input_error');
                        confirmEmailInput.addClass('booknetic_input_error');
                        hasError = booknetic.__('fill_all_required');
                    }
                    else if( emailValue.toLowerCase() !== confirmValue.toLowerCase() )
                    {
                        emailInput.addClass('booknetic_input_error');
                        confirmEmailInput.addClass('booknetic_input_error');
                        hasError = booknetic.__('email_does_not_match');
                    }
                }
            }
        }

        if( hasError !== false )
        {
            return {
                status: false,
                errorMsg: hasError
            };
        }

        return result
    });

    bookneticHooks.addAction('before_step_loading', function( booknetic, new_step_id, old_step_id )
    {
        if( new_step_id !== 'information' )
            return;

        booknetic.stepManager.loadStandartSteps( new_step_id, old_step_id );
    });

    bookneticHooks.addAction('loaded_step', function( booknetic, new_step_id )
    {
        if( new_step_id !== 'information' )
            return;

        let booking_panel_js = booknetic.panel_js;

        var phone_input = booking_panel_js.find('#bkntc_input_phone');

        let iti = window.bookneticIntlTelInput(phone_input[0], {
            initialCountry: phone_input.data('country-code') || 'us',
            separateDialCode: true,
        });

        phone_input.data('iti', iti);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
                let countryData = iti.getSelectedCountryData();
                countryData.iso2 && iti.setCountry(countryData.iso2);
            });
        }
    });

})(jQuery);