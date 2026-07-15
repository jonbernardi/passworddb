<?php

namespace Tests\Feature;

use App\Models\Data;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_records()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'data' => []]);
        $data = [
            [
                'name' => 'field',
                'value' => 'value',
                'type' => 'text',
            ],
            [
                'name' => 'field2',
                'value' => 'value',
                'type' => 'textarea',
            ],
            [
                'name' => 'field3',
                'value' => true,
                'type' => 'boolean',
            ],
        ];
        $response = $this->patch("/{$site->id}/section/{$section->id}/data/{$record->id}", [
            'name' => 'new record',
            'records' => $data,
        ]);
        $record->refresh();
        $this->assertEquals('new record', $record->name);
        $this->assertSame($data, $record->data);
    }

    public function test_that_heading_is_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'name' => 'recordname', 'data' => []]);
        $data = [
            [
                'name' => 'field',
                'value' => 'value',
                'type' => 'text',
            ],
            [
                'name' => 'field2',
                'value' => 'value',
                'type' => 'textarea',
            ],
            [
                'name' => 'field3',
                'value' => true,
                'type' => 'boolean',
            ],
        ];
        $response = $this->patch("/{$site->id}/section/{$section->id}/data/{$record->id}", [
            'name' => '',
            'records' => $data,
        ]);
        $response->assertSessionHasErrors(['name']);
        $record->refresh();
        $this->assertEquals('recordname', $record->name);
        $this->assertSame([], $record->data);
    }

    public function test_that_field_name_is_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'name' => 'recordname', 'data' => []]);
        $data = [
            [
                'name' => '',
                'value' => 'value',
                'type' => 'text',
            ],
            [
                'name' => 'field2',
                'value' => 'value',
                'type' => 'textarea',
            ],
            [
                'name' => 'field3',
                'value' => true,
                'type' => 'boolean',
            ],
        ];
        $response = $this->patch("/{$site->id}/section/{$section->id}/data/{$record->id}", [
            'name' => 'new record',
            'records' => $data,
        ]);
        $response->assertSessionHasErrors(['records.0.name']);
        $record->refresh();
        $this->assertEquals('recordname', $record->name);
        $this->assertSame([], $record->data);
    }

    public function test_at_least_one_field_required()
    {
        $data = [
            [
                'name' => 'field',
                'value' => 'value',
                'type' => 'text',
            ],
            [
                'name' => 'field2',
                'value' => 'value',
                'type' => 'textarea',
            ],
            [
                'name' => 'field3',
                'value' => true,
                'type' => 'boolean',
            ],
        ];

        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $record = Data::factory()->create(['section_id' => $section->id, 'name' => 'recordname', 'data' => $data]);
        $response = $this->patch("/{$site->id}/section/{$section->id}/data/{$record->id}", [
            'name' => 'new record',
            'records' => [],
        ]);
        $response->assertSessionHasErrors(['records']);
        $record->refresh();
        $this->assertEquals('recordname', $record->name);
        $this->assertSame($data, $record->data);
    }
}
