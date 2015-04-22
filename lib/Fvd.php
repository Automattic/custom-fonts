<?php

/*
 * This file is part of the KtwFvd package.
 *
 * (c) Kevin T. Weber <https://github.com/kevintweber/KtwFvd/>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace kevintweber\KtwFvd;

class Fvd
{
    static public function Compact($descriptors)
    {
        // Format input correctly by removing whitespace.
        $descriptors = preg_replace('/\s+/', '', (string)$descriptors);

        $resultArray = array('font-style' => 'n', 'font-weight' => 4);

        $descriptorArray = explode(';', $descriptors);
        foreach ($descriptorArray as $descriptor) {
            if ($descriptor == '') {
                continue;
            }

            list($property, $value) = explode(':', $descriptor);

            switch ($property) {
            case 'font-style':
                $result = self::parseFontStyle($value);
                break;

            case 'font-weight':
                $result = self::parseFontWeight($value);
                break;

            default:
                throw new \LogicException('Invalid property: ' . $property);
            }

            $resultArray[$property] = $result;
        }

        return implode($resultArray);
    }

    static public function Expand($fvd)
    {
        $parsedFvd = self::Parse($fvd);

        $response = '';
        foreach ($parsedFvd as $attribute => $value) {
            $response .= $attribute . ':' . $value . ';';
        }

        return $response;
    }

    /**
     * @param string $fvd The FVD
     *
     * @return array
     */
    static public function Parse($fvd)
    {
        // Validate FVD.
        if (preg_match('/^[i|n|o][1-9]$/', $fvd) !== 1) {
            throw new \InvalidArgumentException('Invalid FVD format.');
        }

        $result = array('font-style' => null, 'font-weight' => null);

        // Parse font-style.
        switch ($fvd[0]) {
        case 'n':
            $result['font-style'] = 'normal';
            break;

        case 'i':
            $result['font-style'] = 'italic';
            break;

        case 'o':
            $result['font-style'] = 'oblique';
            break;

        default:
            throw new \LogicException('Invalid font-style: ' . $fvd[0]);
        }

        // Parse font-weight
        $result['font-weight'] = intval($fvd[1]) * 100;

        return $result;
    }

    static protected function parseFontStyle($value)
    {
        switch ($value) {
        case 'normal':
            return 'n';

        case 'italic':
            return 'i';

        case 'oblique':
            return 'o';
        }

        throw new \InvalidArgumentException('Invalid font style: ' . $value);
    }

    static protected function parseFontWeight($value)
    {
        if ($value == 'normal') {
            return 4;
        }
        else if ($value == 'bold') {
            return 7;
        }

        $result = intval($value[0]);

        if ($result < 1) {
            throw new \InvalidArgumentException('Invalid font weight: ' . $value);
        }

        return $result;
    }
}