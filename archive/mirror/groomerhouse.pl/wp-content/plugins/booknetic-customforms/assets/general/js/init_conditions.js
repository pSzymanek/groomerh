if( typeof bookneticInitFormConditions === 'undefined' )
{
    var bookneticInitFormConditions;

    (function($)
    {
        "use strict";

        bookneticInitFormConditions = function ( booknetic, booking_panel_js, isBackEnd )
        {
            let formConditions = [];
            let revertActions = {};
            let revertActionsTmp = {};
            let stepValidationHasError = false;

            booking_panel_js.find('.booknetic_custom_form[data-conditions]').each(function()
            {
                let conditions = JSON.parse( booknetic.htmlspecialchars_decode( $(this).attr('data-conditions') ) );
                let formId = $(this).data('form-id');

                $(this).removeAttr('data-conditions');

                formConditions.push({
                    form_id: formId,
                    obj: conditions
                });
            });

            var formConditionsCheckTimer;

            booking_panel_js.on('change keyup', '.booknetic_custom_form input, .booknetic_custom_form select', function()
            {
                if( formConditionsCheckTimer )
                    clearTimeout( formConditionsCheckTimer );

                formConditionsCheckTimer = setTimeout( formConditionsCheck, 150);
            });

            function setFieldValue( fieldElement, setValue, action = '' )
            {
                if( fieldElement.is('select') )
                {
                    fieldElement.val(setValue).trigger('change');
                }
                else if( fieldElement.is('input[type="radio"]') || fieldElement.is('input[type="checkbox"]') )
                {
                    if( String( setValue ) === "" || ! setValue )
                    {
                        fieldElement.filter(':checked').prop('checked', false).trigger('change');
                    }
                    else
                    {
                        fieldElement.filter('[value="'+setValue+'"]').click();
                    }
                }
                else if( fieldElement.is('div') && action === 'set_value' )
                {
                    // bu function div( yeni label ) show-hide olunanda-da ise dusur, daha sonra hide olub yeniden show olsa eger texti silinir, ona gorede visual olaraq element yox imis kimi gorunur. Heleki labelin texti yalniz action set_value dursa deyismelidi, eyni problem linklerde-de olurdu
                    fieldElement.text( setValue );
                }
                else if( fieldElement.is('a') && action === 'set_value' )
                {
                    fieldElement.attr( 'href', setValue );
                }
                else
                {
                    fieldElement.val( setValue ).trigger('change');
                }
            }

            function addToRevertActions( field_id, action )
            {
                delete revertActions[ field_id];
                revertActionsTmp[ field_id] = action;
            }

            function startRevertingActions()
            {
                Object.keys( revertActions ).forEach(function( field_id )
                {
                    let action = revertActions[ field_id ];

                    if( action ==='disable' )
                    {
                        booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]').attr('disabled', 'disabled');
                    }
                    else if( action ==='enable' )
                    {
                        booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]').removeAttr('disabled');
                    }
                    else if( action ==='show' )
                    {
                        booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]').closest('.form-group').show();
                    }
                    else if( action ==='hide' )
                    {
                        booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]').closest('.form-group').hide();
                        setFieldValue( booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]'), '' )
                    }
                });

                revertActions = revertActionsTmp;
                revertActionsTmp = {};

                if( ! isBackEnd )
                {
                    booknetic.handleScroll();
                }
            }

            function formConditionsCheck()
            {
                stepValidationHasError = false;

                for( let i in formConditions )
                {
                    let formId = formConditions[i]['form_id'];
                    let conditionTabs = formConditions[i]['obj'];

                    for( let tabI in conditionTabs )
                    {
                        let tabObj      = conditionTabs[ tabI ];
                        let conditions  = tabObj['conditions'];
                        let events      = tabObj['events'];
                        let result      = '';

                        for( let k in conditions )
                        {
                            let field = conditions[k]['field'];
                            let field_data = conditions[k]['field_data'];
                            let operator = conditions[k]['operator'];
                            let value = conditions[k]['value'];
                            let andOr = conditions[k]['condition'];

                            let isCustomField = ! isNaN( parseInt( field ) );
                            let compare_data;
                            let compare_field = booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field + '"]');

                            if( isCustomField )
                            {
                                if( compare_field.is('input[type="checkbox"]') )
                                {
                                    compare_data = compare_field.filter(':checked').map(function(i, e) {return e.value}).toArray();
                                }
                                else if( compare_field.is('input[type="radio"]') )
                                {
                                    compare_data = compare_field.filter(':checked').val();
                                }
                                else
                                {
                                    compare_data = compare_field.val();
                                }
                            }
                            else if( field === 'service_id' )
                            {
                                if( isBackEnd === true )
                                {
                                    compare_data = $('#input_service').val();
                                }
                                else
                                {
                                    compare_data = booknetic.getSelected.service();
                                }
                            }
                            else if( field === 'staff_id' )
                            {
                                if( isBackEnd === true )
                                {
                                    compare_data = $('#input_staff').val();
                                }
                                else
                                {
                                    compare_data = booknetic.getSelected.staff();
                                }
                            }
                            else if( field === 'location_id' )
                            {
                                if( isBackEnd === true )
                                {
                                    compare_data = $('#input_location').val();
                                }
                                else
                                {
                                    compare_data = booknetic.getSelected.location();
                                }
                            }

                            if( field_data === 'length' )
                            {
                                compare_data = compare_data.length;
                            }
                            else if( field_data === 'file_size' )
                            {
                                if( compare_field[0].files.length > 0 )
                                {
                                    compare_data = compare_field[0].files[0].size / 1024;
                                }
                                else
                                {
                                    compare_data = null;
                                }
                            }

                            if( result != '' )
                            {
                                result += andOr === 'AND' ? ' && ' : ' || ';
                            }

                            if( operator === '=' )
                            {
                                result += String( compare_data ) === String( value ) ? ' true ' : ' false ';
                            }
                            else if( operator === '!=' )
                            {
                                result += String( compare_data ) !== String( value ) ? ' true ' : ' false ';
                            }
                            else if( operator ==='>' )
                            {
                                if( compare_data === null )
                                {
                                    result += ' false ';
                                }
                                else if( ! isNaN( parseFloat( compare_data ) ) && ! isNaN( parseFloat( value ) ) )
                                {
                                    result += parseFloat( compare_data ) > parseFloat( value ) ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += compare_data > value ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='>=' )
                            {
                                if( compare_data === null )
                                {
                                    result += ' false ';
                                }
                                else if( ! isNaN( parseFloat( compare_data ) ) && ! isNaN( parseFloat( value ) ) )
                                {
                                    result += parseFloat( compare_data ) >= parseFloat( value ) ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += compare_data >= value ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='<' )
                            {
                                if( compare_data === null || compare_data === '' )
                                {
                                    result += ' false ';
                                }
                                else if( ! isNaN( parseFloat( compare_data ) ) && ! isNaN( parseFloat( value ) ) )
                                {
                                    result += parseFloat( compare_data ) < parseFloat( value ) ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += compare_data < value ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='<=' )
                            {
                                if( compare_data === null )
                                {
                                    result += ' false ';
                                }
                                else if( ! isNaN( parseFloat( compare_data ) ) && ! isNaN( parseFloat( value ) ) )
                                {
                                    result += parseFloat( compare_data ) <= parseFloat( value ) ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += compare_data <= value ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='is_empty' )
                            {
                                result += String( compare_data ) === "" || compare_data === null || compare_data === undefined || compare_data === false || compare_data === [] ? ' true ' : ' false ';
                            }
                            else if( operator ==='is_not_empty' )
                            {
                                result += ! (String( compare_data ) === "" || compare_data === null || compare_data === undefined || compare_data === false || compare_data === []) ? ' true ' : ' false ';
                            }
                            else if( operator ==='contains' )
                            {
                                if( Array.isArray( compare_data ) && Array.isArray( value ) )
                                {
                                    let resutlArr = true;
                                    for( let r in value )
                                    {
                                        if( ! compare_data?.includes( value[r] ) )
                                        {
                                            resutlArr = false;
                                            break;
                                        }
                                    }

                                    result += resutlArr ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += String( compare_data ).indexOf( value ) > -1 ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='regex' )
                            {
                                result += String( compare_data ).match( new RegExp( value ) ) ? ' true ' : ' false ';
                            }
                            else if( operator ==='!contains' )
                            {
                                if( Array.isArray( compare_data ) && Array.isArray( value ) )
                                {
                                    let resutlArr = true;
                                    for( let r in value )
                                    {
                                        if( ! compare_data?.includes( value[r] ) )
                                        {
                                            resutlArr = false;
                                            break;
                                        }
                                    }

                                    result += ! resutlArr ? ' true ' : ' false ';
                                }
                                else
                                {
                                    result += String(compare_data).indexOf(value) === -1 ? ' true ' : ' false ';
                                }
                            }
                            else if( operator ==='starts_with' )
                            {
                                result += String( compare_data ).startsWith( value ) ? ' true ' : ' false ';
                            }
                            else if( operator ==='!starts_with' )
                            {
                                result += !String( compare_data ).startsWith( value ) ? ' true ' : ' false ';
                            }
                            else if( operator ==='ends_with' )
                            {
                                result += String( compare_data ).endsWith( value ) ? ' true ' : ' false ';
                            }
                            else if( operator ==='!ends_with' )
                            {
                                result += !String( compare_data ).endsWith( value ) ? ' true ' : ' false ';
                            }
                        }

                        if( result != '' && eval(result) )
                        {
                            for( let e in events )
                            {
                                let field_id = events[e]['field_id'];
                                let action = events[e]['action'];
                                let fieldElement = booking_panel_js.find('.booknetic_custom_form [data-input-id="' + field_id + '"]');

                                if( action ==='disable' )
                                {
                                    addToRevertActions(field_id, 'enable');
                                    fieldElement.attr('disabled', 'disabled');
                                }
                                else if( action ==='enable' )
                                {
                                    addToRevertActions(field_id, 'disable');
                                    fieldElement.removeAttr('disabled');
                                }
                                else if( action ==='show' )
                                {
                                    addToRevertActions(field_id, 'hide');
                                    fieldElement.closest('.form-group').show();
                                }
                                else if( action ==='hide' || (! isBackEnd && action ==='hide_for_customers') )
                                {
                                    addToRevertActions(field_id, 'show');
                                    fieldElement.closest('.form-group').hide();

                                    setFieldValue( fieldElement, '' )
                                }
                                else if( action ==='set_value' )
                                {
                                    let setValue = events[e]['value'];

                                    setFieldValue( fieldElement, setValue, action )
                                }
                                else if( action ==='throw_error' )
                                {
                                    let errorMessage = events[e]['value'];

                                    booknetic.toast( errorMessage, 'unsuccess' );

                                    stepValidationHasError = errorMessage;
                                }
                            }
                        }
                    }
                }

                if( formConditions.length > 0 )
                {
                    startRevertingActions();
                }

                if( ! isBackEnd )
                {
                    booknetic.handleScroll();
                }
            }

            if( ! isBackEnd )
            {
                bookneticHooks.addFilter('step_validation_information', function ( params , booknetic )
                {
                    if( stepValidationHasError !== false && params.status )
                    {
                        params.status = false;
                        params.errorMsg = stepValidationHasError;
                    }

                    return params;
                });
            }
            else
            {
                booknetic.addFilter('appointments.validation', function ( params )
                {
                    if( stepValidationHasError !== false )
                    {
                        params = stepValidationHasError;
                    }

                    return params;
                });
            }

            formConditionsCheck();
        }

    })(jQuery);
}
