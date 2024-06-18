import { Category } from '@/app/interfaces/categories';
import { useAutocomplete, UseAutocompleteProps } from '@mui/base/useAutocomplete';
import { RiCloseFill } from '@remixicon/react';
import { Badge, Icon } from '@tremor/react';
import { ForwardedRef, forwardRef } from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';

function AutoComplete(
  props: UseAutocompleteProps<Category, false, false, false>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    disableClearable = false,
    disabled = false,
    readOnly = false,
    isOptionEqualToValue,
    getOptionLabel,
    ...other
  } = props

  const {
    getInputProps,
    getRootProps,
    getListboxProps,
    getOptionProps,
    getClearProps,
    groupedOptions,
    dirty,
    setAnchorEl
  } = useAutocomplete({
    ...props
  })

  const hasClearIcon = !disableClearable && !disabled && dirty && !readOnly
  const rootRef = useForkRef(ref, setAnchorEl)

  return (
    <div className='w-[220px]'>
      <div {...getRootProps(other)} ref={rootRef}>
        {hasClearIcon &&
          <div className='flex items-center'>
            <Badge>{props.value?.name}</Badge>
            <div className='grow' />
            <Icon {...getClearProps()}
              icon={RiCloseFill} size='sm'
              color="neutral"
              className='flex items-center justify-center h-[20px] w-[20px] z-40 cursor-pointer dark:bg-dark-tremor-background-subtle rounded-lg'
            />
          </div>
        }

        <input {...getInputProps()}
          className={`${hasClearIcon ? 'hidden' : 'flex'} tremor-TextInput-root w-full items-center min-w-[10rem] outline-none rounded-tremor-default transition duration-100 border shadow-tremor-input dark:shadow-dark-tremor-input bg-tremor-background dark:bg-dark-tremor-background hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted text-tremor-content dark:text-dark-tremor-content border-tremor-border dark:border-dark-tremor-border`}
        />

      </div>
      {groupedOptions.length > 0 &&
        <ul
          {...getListboxProps()}
          className='absolute w-fit my-1 min-w-[220px] max-h-[300px] overflow-auto drop-shadow-md rounded-lg border border-dark-tremor-border bg-dark-tremor-background z-50'
        >
          {(groupedOptions as Category[]).map((option, index) => (
            <li {...getOptionProps({ option, index })}
              key={index}
              className='p-2 cursor-pointer dark:hover:bg-dark-tremor-background-subtle'
            >
              <div className='grid grid-cols-3 gap-x-4'>
                <div>{option.name}</div>
                <div>{option.date}</div>
                <div>{option.budget}</div>
              </div>
            </li>
          ))}
        </ul>
      }

    </div>
  )

}

export default forwardRef(AutoComplete)
