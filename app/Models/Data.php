<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Spatie\EloquentSortable\Sortable;
use Spatie\EloquentSortable\SortableTrait;

class Data extends Model implements Sortable
{
    use HasFactory, SortableTrait;

    protected $guarded = [];

    public $sortable = [
        'order_column_name' => 'sort',
        'sort_when_creating' => true,
    ];

    /**
     * Get the post that owns the comment.
     */
    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    /**
     * @param  array|null  $value
     * @return array
     */
    public function getDataAttribute($value)
    {
        if ($value === null) {
            return [];
        }

        return array_values(
            collect(json_decode(Crypt::decryptString($value), true))
                ->map(function ($record, $key) {
                    if (! is_array($record)) {
                        return [
                            'name' => $key,
                            'value' => trim($record) !== '' ? trim($record) : null,
                            'type' => 'text',
                        ];
                    }

                    return $this->normalizeValue($record);
                })
                ->filter()
                ->toArray()
        );
    }

    /**
     * @param  array|null  $value
     */
    public function setDataAttribute($value)
    {
        if ($value === null) {
            $value = [];
        }
        if (! is_array($value)) {
            throw new \InvalidArgumentException('Invalid data value');
        }
        $this->attributes['data'] = Crypt::encryptString(
            json_encode(
                array_values(
                    collect($value)
                        ->map(fn ($record) => $this->normalizeValue($record))
                        ->filter()
                        ->toArray()
                )
            )
        );
    }

    public function buildSortQuery()
    {
        return static::query()->where('section_id', $this->section_id);
    }

    private function normalizeValue(array $record): ?array
    {
        if (empty($record['name'])) {
            return null;
        }
        $type = $record['type'] ?? 'text';
        $value = $record['value'];
        if (in_array($type, ['boolean', 'checkbox'])) {
            $type = 'boolean';
            $value = (bool) $record['value'];
        }
        if (in_array($type, ['number', 'integer'])) {
            $value = (int) $record['value'];
        }
        if (in_array($type, ['float', 'decimal'])) {
            $value = (float) $record['value'];
        }
        if (in_array($type, ['text', 'line'])) {
            $value = trim(preg_replace('/\s+/', ' ', $record['value']));
        }
        if (in_array($type, ['text', 'textarea', 'paragraph', 'markdown', 'html', 'code'])) {
            $value = trim($record['value']);
        }
        if ($value === '') {
            $value = null;
        }

        return [
            'name' => $record['name'],
            'value' => $value,
            'type' => $type,
        ];
    }
}
