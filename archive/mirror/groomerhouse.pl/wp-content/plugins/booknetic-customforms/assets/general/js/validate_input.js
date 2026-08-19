if( typeof bookneticCustomFieldValidation === 'undefined' )
{
    var bookneticCustomFieldValidation;

    (function($)
    {
        "use strict";

        bookneticCustomFieldValidation = {
            validateEmail: function(email)
            {
                const mailFormat = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
                return !!email.match(mailFormat);
            },

            validatePhone: function (phone)
            {
                const phoneFormat = /^([0-9\s\(\)+-]+)$/;
                return !!phone.match(phoneFormat);
            },

            validateDate: function (date)
            {
                date = date.replace(/\s+/g, '')
                let dateFormatRegex = ''
                let isBackend = (typeof BookneticData === 'undefined');
                switch ( !isBackend ? BookneticData.date_format : window.dateFormat  )
                {
                    case 'Y-m-d':
                        dateFormatRegex = /^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/
                        return !!date.match(dateFormatRegex);
                    case 'd-m-Y':
                        dateFormatRegex = /^([0-9]{2})\-([0-9]{2})\-([0-9]{4})$/
                        return !!date.match(dateFormatRegex);
                    case 'd.m.Y':
                        dateFormatRegex = /^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/
                        return !!date.match(dateFormatRegex);
                    case 'd/m/Y':
                        dateFormatRegex = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/
                        return !!date.match(dateFormatRegex);
                    case 'm/d/Y':
                        dateFormatRegex = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/
                        return !!date.match(dateFormatRegex);
                }
            },

            validateInput: function (el, errorClass, booknetic)
            {
                let hasError = false;

                let required = el.prev().is('[data-required="true"]');
                let isMinLength = el.is('[minlength]');
                let isMaxLength = el.is('[maxlength]');
                let minLength = el.attr('minlength');
                let maxLength = el.attr('maxlength');
                let dataType  = el.attr('data-type');
                let visible   = el.closest( '.form-group' ).css( 'display' ) !== 'none';

                if( el.is('div.iti') )
                {
                    el = el.find('input');
                }

                if (el.hasClass('bkntc-date-wrapper')) {
                    el = el.find("input");
                }

                if( el.is('input[type=text], input[type=file], input[type=number], input[type=date], input[type=time], input:not([type]), textarea, select') )
                {
                    let value        = el.val();
                    let valueIsEmpty = ! value || value.trim() == '';

                    if ( ! visible ) //do not validate hidden fields
                        return true;

                    if ( valueIsEmpty && ! required ) //do not validate empty, optional fields
                        return true;

                    if( dataType === 'email' )
                    {
                        if ( ! this.validateEmail( value ) )
                        {
                            el.addClass( errorClass );
                            hasError = booknetic.__('email_is_not_valid');
                        }
                    }
                    else if( dataType === 'phone' )
                    {
                        if ( ! this.validatePhone( value ) )
                        {
                            el.addClass( errorClass );
                            hasError = booknetic.__('phone_is_not_valid');
                        }
                    }
                    else if ( dataType === 'date' )
                    {
                        if ( ! this.validateDate ( value ) )
                        {
                            el.addClass( errorClass );
                            hasError = booknetic.__('Select date');
                        }
                    }

                    if( el.attr('type') === 'file' && valueIsEmpty && el.parent().find('.remove_custom_file_btn').length > 0 )
                    {
                        valueIsEmpty = false;
                    }

                    if( required && valueIsEmpty )
                    {
                        if( el.is('select') )
                        {
                            el.next().find('.select2-selection').addClass( errorClass );
                        }
                        else if( el.is('input[type="file"]') )
                        {
                            el.next().addClass( errorClass );
                        }
                        else
                        {
                            el.addClass( errorClass );
                        }

                        hasError = booknetic.__('fill_all_required');
                    }

                    if( required && isMinLength && parseInt(minLength) && value.length < minLength ){
                        el.addClass( errorClass );
                        hasError = booknetic.__('min_length').replace(/%s/, el.prev().text()).replace(/%d/, minLength);
                    }else if(isMaxLength && parseInt(maxLength) && value.toString().length > maxLength){
                        el.addClass( errorClass );
                        hasError = booknetic.__('max_length').replace(/%s/, el.prev().text()).replace(/%d/, maxLength);
                    }
                }
                else if( el.is('div') ) // checkboxes or radios
                {
                    let condition = el.find('input:checked').length === 0;

                    if( visible && required && condition )
                    {
                        el.find('input').addClass( errorClass );
                        hasError = booknetic.__('fill_all_required');
                    }
                }

                return hasError === false ? true : hasError;
            }
        };

    })(jQuery);
}

