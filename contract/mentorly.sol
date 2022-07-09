// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Mentorly {

    uint internal mentorsLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    // string[] internal expertise;

    struct Mentor {
        address payable owner;
        string name;
        string expertise;
        string image;
        uint price;
        uint mentee;
    }

    mapping (uint => Mentor) internal mentors;

    function uploadMentor(
        string memory _name,
        string memory _expertise,
        string memory _image, 
        uint _price
    ) public {
        uint _mentee = 0;
        mentors[mentorsLength] = Mentor(
            payable(msg.sender),
            _name,
            _expertise,
            _image,
            _price,
            _mentee
        );
        mentorsLength++;
    }

    function readMentors(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        uint, 
        uint
    ) {
        return (
            mentors[_index].owner,
            mentors[_index].name, 
            mentors[_index].expertise, 
            mentors[_index].image, 
            mentors[_index].price,
            mentors[_index].mentee
        );
    }
    
    function bookMentor(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            mentors[_index].owner,
            mentors[_index].price
          ),
          "Transfer failed."
        );
        mentors[_index].mentee++;
    }
    
    function getMentorsLength() public view returns (uint) {
        return (mentorsLength);
    }
}